const { getSession } = require('../neo4j/driver');
const { filterGraphByParams, diffSnapshots, sampleSnapshots, searchSnapshot } = require('../data/sampleGraph');
const config = require('../config');

const DEFAULT_DIRECTION = '-';

const getEffectiveSnapshot = (snapshot) => snapshot || config.sampleSnapshot;

const withNeo4jFallback = async ({ fallback, query, errorMessage }) => {
  const session = getSession();
  if (!session) return fallback();

  try {
    return await query(session);
  } catch (error) {
    console.error(`${errorMessage}:`, error.message);
    return fallback();
  } finally {
    await session.close();
  }
};

const getDirectionSymbol = (direction) => {
  if (direction === 'up') return '<-';
  if (direction === 'down') return '->';
  return DEFAULT_DIRECTION;
};

const buildEdgeFromSegment = (segment) => ({
  id: `${segment.start.properties.id}-${segment.relationship.type}-${segment.end.properties.id}`,
  from: segment.start.properties.id,
  to: segment.end.properties.id,
  type: segment.relationship.type,
  properties: segment.relationship.properties,
});

const normalizeNode = (node) => ({ id: node.id, labels: node.labels, ...node.props });

async function getGraph({ rootId, depth, direction, snapshot }) {
  const effectiveSnapshot = getEffectiveSnapshot(snapshot);
  const parsedDepth = Number(depth) || 10;
  const fallback = () => filterGraphByParams(effectiveSnapshot, { rootId, depth: parsedDepth, direction });

  return withNeo4jFallback({
    fallback,
    errorMessage: 'Neo4j graph query failed, falling back to sample data',
    query: async (session) => {
      const queryDirection = getDirectionSymbol(direction);
      const cypher = `
        MATCH (root {id: $rootId})
        OPTIONAL MATCH path=(root)${queryDirection}[:INGESTS_FROM|:READS_FROM|:WRITES_TO|:DELIVERS_TO|:CALLS|:USES_CONNECTION|:RUNS_ON|:TRIGGERS*1..$depth]${queryDirection}(n)
        RETURN collect(distinct root) as roots, collect(distinct n) as nodes, collect(distinct path) as paths
      `;

      const result = await session.run(cypher, { rootId, depth: parsedDepth });
      const record = result.records[0];
      const nodeList = [...record.get('roots'), ...record.get('nodes')].filter(Boolean);
      const nodes = nodeList.map((node) => ({ id: node.properties.id, labels: node.labels, ...node.properties }));
      const edgesSet = new Map();

      record.get('paths').forEach((path) => {
        path.segments.forEach((segment) => {
          const edge = buildEdgeFromSegment(segment);
          if (!edgesSet.has(edge.id)) edgesSet.set(edge.id, edge);
        });
      });

      return { nodes, edges: Array.from(edgesSet.values()) };
    },
  });
}

async function getFullGraph(snapshot) {
  const effectiveSnapshot = getEffectiveSnapshot(snapshot);
  const fallback = () => sampleSnapshots[effectiveSnapshot] || sampleSnapshots[config.sampleSnapshot];

  return withNeo4jFallback({
    fallback,
    errorMessage: 'Full graph query failed, falling back to sample data',
    query: async (session) => {
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

      const result = await session.run(cypher, { snapshot: snapshot || null });
      const record = result.records[0];
      const nodes = record.get('nodes').map(normalizeNode);
      const edges = record.get('relationships').map((rel) => ({
        id: rel.id,
        from: rel.from,
        to: rel.to,
        type: rel.type,
        properties: rel.properties,
      }));
      return { nodes, edges };
    },
  });
}

async function searchEntities({ term, snapshot }) {
  const effectiveSnapshot = getEffectiveSnapshot(snapshot);
  const lowered = term.toLowerCase();
  const fallback = () => searchSnapshot(effectiveSnapshot, term);

  return withNeo4jFallback({
    fallback,
    errorMessage: 'Search query failed, falling back to sample data',
    query: async (session) => {
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

      const result = await session.run(cypher, { snapshot: snapshot || null, term: lowered });
      const record = result.records[0];
      const nodes = record.get('nodes') || [];
      const edges = record.get('edges') || [];
      return { nodes, edges };
    },
  });
}

async function getDiff(baseSnapshot, targetSnapshot) {
  if (baseSnapshot === targetSnapshot) {
    return { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [] };
  }

  const fallback = () => diffSnapshots(baseSnapshot, targetSnapshot);

  return withNeo4jFallback({
    fallback,
    errorMessage: 'Diff query failed, falling back to sample data',
    query: async (session) => {
      const cypher = `
        MATCH (n)
        WHERE n.snapshot_at IN [$base, $target]
        WITH n.snapshot_at AS snap, collect(n) AS nodes
        UNWIND nodes AS node
        RETURN snap, collect(DISTINCT {id: node.id, labels: labels(node), props: node}) AS nodes
      `;

      const result = await session.run(cypher, { base: baseSnapshot, target: targetSnapshot });
      const snapshotMap = new Map();
      result.records.forEach((record) => {
        snapshotMap.set(record.get('snap'), record.get('nodes'));
      });

      const baseNodes = snapshotMap.get(baseSnapshot) || [];
      const targetNodes = snapshotMap.get(targetSnapshot) || [];

      const baseNodeIds = new Set(baseNodes.map((node) => node.id));
      const targetNodeIds = new Set(targetNodes.map((node) => node.id));

      return {
        addedNodes: targetNodes.filter((node) => !baseNodeIds.has(node.id)),
        removedNodes: baseNodes.filter((node) => !targetNodeIds.has(node.id)),
        // Edge-level diff would require relationship snapshots; omitted for brevity in this draft.
        addedEdges: [],
        removedEdges: [],
      };
    },
  });
}

const listSnapshots = () => Object.keys(sampleSnapshots);

module.exports = { getGraph, getFullGraph, getDiff, listSnapshots, searchEntities };
