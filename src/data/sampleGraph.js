const sampleSnapshots = {
  '2024-01-01T00:00:00Z': {
    nodes: [
      { id: 'ext-salesforce', label: 'ExternalSystem', name: 'Salesforce', type: 'SaaS' },
      { id: 'bronze-landing', label: 'Dataset', name: 'Landing Bucket', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'ingest-oppty', label: 'Pipeline', name: 'Opportunity Ingestion', type: 'Ingestion' },
      { id: 'silver-core', label: 'Dataset', name: 'Opportunity Core', layer: 'Silver', type: 'Table' },
      { id: 'mapping-core', label: 'Pipeline', name: 'Opportunity Mapping', type: 'Mapping' },
    ],
    edges: [
      { id: 'ext-to-ingest', from: 'ext-salesforce', to: 'ingest-oppty', type: 'INGESTS_FROM' },
      { id: 'ingest-to-bronze', from: 'ingest-oppty', to: 'bronze-landing', type: 'WRITES_TO' },
      { id: 'map-reads-bronze', from: 'bronze-landing', to: 'mapping-core', type: 'READS_FROM' },
      { id: 'map-writes-silver', from: 'mapping-core', to: 'silver-core', type: 'WRITES_TO' },
    ],
  },
  '2024-02-01T00:00:00Z': {
    nodes: [
      { id: 'ext-salesforce', label: 'ExternalSystem', name: 'Salesforce', type: 'SaaS' },
      { id: 'bronze-landing', label: 'Dataset', name: 'Landing Bucket', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'ingest-oppty', label: 'Pipeline', name: 'Opportunity Ingestion', type: 'Ingestion' },
      { id: 'silver-core', label: 'Dataset', name: 'Opportunity Core', layer: 'Silver', type: 'Table' },
      { id: 'mapping-core', label: 'Pipeline', name: 'Opportunity Mapping', type: 'Mapping' },
      { id: 'gold-mart', label: 'Dataset', name: 'Opportunity Gold Mart', layer: 'Gold', type: 'DataMart' },
      { id: 'taskflow-gold', label: 'Pipeline', name: 'Gold Builder', type: 'Taskflow' },
      { id: 'powerbi', label: 'BIApp', name: 'Power BI', type: 'PowerBI' },
    ],
    edges: [
      { id: 'ext-to-ingest', from: 'ext-salesforce', to: 'ingest-oppty', type: 'INGESTS_FROM' },
      { id: 'ingest-to-bronze', from: 'ingest-oppty', to: 'bronze-landing', type: 'WRITES_TO' },
      { id: 'map-reads-bronze', from: 'bronze-landing', to: 'mapping-core', type: 'READS_FROM' },
      { id: 'map-writes-silver', from: 'mapping-core', to: 'silver-core', type: 'WRITES_TO' },
      { id: 'taskflow-reads-silver', from: 'silver-core', to: 'taskflow-gold', type: 'READS_FROM' },
      { id: 'taskflow-writes-gold', from: 'taskflow-gold', to: 'gold-mart', type: 'WRITES_TO' },
      { id: 'gold-delivers-bi', from: 'gold-mart', to: 'powerbi', type: 'DELIVERS_TO' },
    ],
  },
};

function buildAdjacency(edges, direction) {
  const adjacency = new Map();
  edges.forEach((edge) => {
    if (direction === 'up') {
      if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
      adjacency.get(edge.to).push(edge.from);
    } else if (direction === 'both') {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
      adjacency.get(edge.from).push(edge.to);
      adjacency.get(edge.to).push(edge.from);
    } else {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      adjacency.get(edge.from).push(edge.to);
    }
  });
  return adjacency;
}

function filterGraphByParams(snapshot, { rootId, depth = 2, direction = 'both' }) {
  const dataset = sampleSnapshots[snapshot] || sampleSnapshots['2024-02-01T00:00:00Z'];
  const edges = dataset.edges;
  const nodes = dataset.nodes;
  if (!rootId) return dataset;

  const adjacency = buildAdjacency(edges, direction);
  const visited = new Set([rootId]);
  const queue = [{ id: rootId, level: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.level >= depth) continue;
    const neighbors = adjacency.get(current.id) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, level: current.level + 1 });
      }
    });
  }

  const filteredNodes = nodes.filter((node) => visited.has(node.id));
  const filteredEdges = edges.filter((edge) => visited.has(edge.from) && visited.has(edge.to));

  return { nodes: filteredNodes, edges: filteredEdges };
}

function diffSnapshots(base, target) {
  const baseData = sampleSnapshots[base] || { nodes: [], edges: [] };
  const targetData = sampleSnapshots[target] || { nodes: [], edges: [] };

  const baseNodeIds = new Set(baseData.nodes.map((n) => n.id));
  const targetNodeIds = new Set(targetData.nodes.map((n) => n.id));
  const baseEdgeIds = new Set(baseData.edges.map((e) => e.id));
  const targetEdgeIds = new Set(targetData.edges.map((e) => e.id));

  return {
    addedNodes: targetData.nodes.filter((node) => !baseNodeIds.has(node.id)),
    removedNodes: baseData.nodes.filter((node) => !targetNodeIds.has(node.id)),
    addedEdges: targetData.edges.filter((edge) => !baseEdgeIds.has(edge.id)),
    removedEdges: baseData.edges.filter((edge) => !targetEdgeIds.has(edge.id)),
  };
}

module.exports = { sampleSnapshots, filterGraphByParams, diffSnapshots };
