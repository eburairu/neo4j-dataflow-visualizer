const { getSession } = require('../neo4j/driver');
const { filterGraphByParams, diffSnapshots, sampleSnapshots } = require('../data/sampleGraph');
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

module.exports = { getGraph, getDiff, listSnapshots };
