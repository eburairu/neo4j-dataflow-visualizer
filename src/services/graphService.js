const { getSession } = require('../neo4j/driver');
const { filterGraphByParams, diffSnapshots, sampleSnapshots, searchSnapshot } = require('../data/sampleGraph');
const config = require('../config');

async function getGraph({ rootId, depth, direction, snapshot }) {
  const session = getSession();
  const effectiveSnapshot = snapshot || config.sampleSnapshot;

  if (!session) {
    return filterGraphByParams(effectiveSnapshot, { rootId, depth, direction });
  }

  const queryDirection = direction === 'up' ? '<-' : direction === 'down' ? '->' : '-';
  const cypher = `
    MATCH (root {id: $rootId})
    OPTIONAL MATCH path=(root)${queryDirection}[:INGESTS_FROM|:READS_FROM|:WRITES_TO|:DELIVERS_TO|:CALLS|:USES_CONNECTION|:RUNS_ON|:TRIGGERS*1..$depth]${queryDirection}(n)
    RETURN collect(distinct root) as roots, collect(distinct n) as nodes, collect(distinct path) as paths
  `;

  try {
    const result = await session.run(cypher, { rootId, depth: Number(depth) || 10 });
    const record = result.records[0];
    const nodeList = [...record.get('roots'), ...record.get('nodes')].filter(Boolean);
    const nodes = nodeList.map((node) => ({ id: node.properties.id, labels: node.labels, ...node.properties }));
    const edgesSet = new Map();

    record.get('paths').forEach((path) => {
      path.segments.forEach((segment) => {
        const edgeId = `${segment.start.properties.id}-${segment.relationship.type}-${segment.end.properties.id}`;
        if (!edgesSet.has(edgeId)) {
          edgesSet.set(edgeId, {
            id: edgeId,
            from: segment.start.properties.id,
            to: segment.end.properties.id,
            type: segment.relationship.type,
            properties: segment.relationship.properties,
          });
        }
      });
    });

    return { nodes, edges: Array.from(edgesSet.values()) };
  } catch (error) {
    console.error('Neo4j query failed, falling back to sample data:', error.message);
    return filterGraphByParams(effectiveSnapshot, { rootId, depth, direction });
  } finally {
    if (session) await session.close();
  }
}

async function getFullGraph(snapshot) {
  const session = getSession();
  const effectiveSnapshot = snapshot || config.sampleSnapshot;

  if (!session) {
    return sampleSnapshots[effectiveSnapshot] || sampleSnapshots[config.sampleSnapshot];
  }

  const cypher = `
    MATCH (n)
    WHERE $snapshot IS NULL OR n.snapshot_at = $snapshot
    OPTIONAL MATCH (n)-[r]->(m)
    RETURN collect(distinct { id: n.id, labels: labels(n), props: n }) as nodes,
           collect(distinct {
             id: coalesce(r.id, startNode(r).id + '-' + type(r) + '-' + endNode(r).id),
             from: startNode(r).id,
             to: endNode(r).id,
             type: type(r),
             properties: r
           }) as relationships
  `;

  try {
    const result = await session.run(cypher, { snapshot: snapshot || null });
    const record = result.records[0];
    const nodes = record.get('nodes').map((node) => ({ id: node.id, labels: node.labels, ...node.props }));
    const edges = record.get('relationships').map((rel) => ({
      id: rel.id,
      from: rel.from,
      to: rel.to,
      type: rel.type,
      properties: rel.properties,
    }));
    return { nodes, edges };
  } catch (error) {
    console.error('Full graph query failed, falling back to sample data:', error.message);
    return sampleSnapshots[effectiveSnapshot] || sampleSnapshots[config.sampleSnapshot];
  } finally {
    if (session) await session.close();
  }
}

async function searchEntities({ term, snapshot }) {
  const session = getSession();
  const effectiveSnapshot = snapshot || config.sampleSnapshot;

  if (!session) {
    return searchSnapshot(effectiveSnapshot, term);
  }

  const lowered = term.toLowerCase();
  const cypher = `
    MATCH (n)
    WHERE ($snapshot IS NULL OR n.snapshot_at = $snapshot)
      AND (toLower(n.id) CONTAINS $term OR toLower(coalesce(n.name, '')) CONTAINS $term)
    WITH collect(distinct { id: n.id, label: labels(n)[0], name: n.name, type: n.type, layer: n.layer, properties: n }) as nodes
    OPTIONAL MATCH (a)-[r]->(b)
    WHERE ($snapshot IS NULL OR r.snapshot_at = $snapshot)
      AND (toLower(r.type) CONTAINS $term OR toLower(coalesce(r.name, '')) CONTAINS $term)
    RETURN nodes, collect(distinct {
      id: coalesce(r.id, a.id + '-' + r.type + '-' + b.id),
      type: r.type,
      from: a.id,
      to: b.id,
      properties: r
    }) as edges
  `;

  try {
    const result = await session.run(cypher, { snapshot: snapshot || null, term: lowered });
    const record = result.records[0];
    const nodes = record.get('nodes') || [];
    const edges = record.get('edges') || [];
    return { nodes, edges };
  } catch (error) {
    console.error('Search query failed, falling back to sample data:', error.message);
    return searchSnapshot(effectiveSnapshot, term);
  } finally {
    if (session) await session.close();
  }
}

async function getDiff(baseSnapshot, targetSnapshot) {
  if (baseSnapshot === targetSnapshot) {
    return { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [] };
  }

  const session = getSession();
  if (!session) {
    return diffSnapshots(baseSnapshot, targetSnapshot);
  }

  const cypher = `
    MATCH (n)
    WHERE n.snapshot_at IN [$base, $target]
    WITH n.snapshot_at AS snap, collect(n) AS nodes
    UNWIND nodes AS node
    RETURN snap, collect(DISTINCT {id: node.id, labels: labels(node), props: node}) AS nodes
  `;

  try {
    const result = await session.run(cypher, { base: baseSnapshot, target: targetSnapshot });
    const snapshotMap = new Map();
    result.records.forEach((record) => {
      snapshotMap.set(record.get('snap'), record.get('nodes'));
    });

    const baseNodes = snapshotMap.get(baseSnapshot) || [];
    const targetNodes = snapshotMap.get(targetSnapshot) || [];

    const baseNodeIds = new Set(baseNodes.map((n) => n.id));
    const targetNodeIds = new Set(targetNodes.map((n) => n.id));

    return {
      addedNodes: targetNodes.filter((n) => !baseNodeIds.has(n.id)),
      removedNodes: baseNodes.filter((n) => !targetNodeIds.has(n.id)),
      // Edge-level diff would require relationship snapshots; omitted for brevity in this draft.
      addedEdges: [],
      removedEdges: [],
    };
  } catch (error) {
    console.error('Diff query failed, falling back to sample data:', error.message);
    return diffSnapshots(baseSnapshot, targetSnapshot);
  } finally {
    if (session) await session.close();
  }
}

function listSnapshots() {
  return Object.keys(sampleSnapshots);
}

module.exports = { getGraph, getFullGraph, getDiff, listSnapshots, searchEntities };
