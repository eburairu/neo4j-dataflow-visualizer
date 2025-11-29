const sampleSnapshots = {
  '2024-01-01T00:00:00Z': {
    nodes: [
      { id: 'ext-salesforce', label: 'ExternalSystem', name: 'Salesforce', type: 'SaaS' },
      { id: 'bronze-landing', label: 'Dataset', name: 'Landing Bucket', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'ingest-oppty', label: 'Pipeline', name: 'Opportunity Ingestion', type: 'Ingestion' },
      { id: 'silver-core', label: 'Dataset', name: 'Opportunity Core', layer: 'Silver', type: 'Table' },
      { id: 'mapping-core', label: 'Pipeline', name: 'Opportunity Mapping', type: 'Mapping' },
      { id: 'ext-marketing', label: 'ExternalSystem', name: 'Marketing Hub', type: 'SaaS' },
      { id: 'ingest-marketing', label: 'Pipeline', name: 'Marketing Ingestion', type: 'Ingestion' },
      { id: 'bronze-marketing', label: 'Dataset', name: 'Marketing Landing', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'mapping-marketing', label: 'Pipeline', name: 'Marketing Modeling', type: 'Mapping' },
      { id: 'silver-marketing', label: 'Dataset', name: 'Marketing Core', layer: 'Silver', type: 'Table' },
    ],
    edges: [
      { id: 'ext-to-ingest', from: 'ext-salesforce', to: 'ingest-oppty', type: 'INGESTS_FROM' },
      { id: 'ingest-to-bronze', from: 'ingest-oppty', to: 'bronze-landing', type: 'WRITES_TO' },
      { id: 'map-reads-bronze', from: 'bronze-landing', to: 'mapping-core', type: 'READS_FROM' },
      { id: 'map-writes-silver', from: 'mapping-core', to: 'silver-core', type: 'WRITES_TO' },
      { id: 'ext-marketing-to-ingest', from: 'ext-marketing', to: 'ingest-marketing', type: 'INGESTS_FROM' },
      { id: 'ingest-marketing-to-bronze', from: 'ingest-marketing', to: 'bronze-marketing', type: 'WRITES_TO' },
      { id: 'map-marketing-reads', from: 'bronze-marketing', to: 'mapping-marketing', type: 'READS_FROM' },
      { id: 'map-marketing-writes', from: 'mapping-marketing', to: 'silver-marketing', type: 'WRITES_TO' },
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
      { id: 'ext-marketing', label: 'ExternalSystem', name: 'Marketing Hub', type: 'SaaS' },
      { id: 'ingest-marketing', label: 'Pipeline', name: 'Marketing Ingestion', type: 'Ingestion' },
      { id: 'bronze-marketing', label: 'Dataset', name: 'Marketing Landing', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'mapping-marketing', label: 'Pipeline', name: 'Marketing Modeling', type: 'Mapping' },
      { id: 'silver-marketing', label: 'Dataset', name: 'Marketing Core', layer: 'Silver', type: 'Table' },
    ],
    edges: [
      { id: 'ext-to-ingest', from: 'ext-salesforce', to: 'ingest-oppty', type: 'INGESTS_FROM' },
      { id: 'ingest-to-bronze', from: 'ingest-oppty', to: 'bronze-landing', type: 'WRITES_TO' },
      { id: 'map-reads-bronze', from: 'bronze-landing', to: 'mapping-core', type: 'READS_FROM' },
      { id: 'map-writes-silver', from: 'mapping-core', to: 'silver-core', type: 'WRITES_TO' },
      { id: 'ext-marketing-to-ingest', from: 'ext-marketing', to: 'ingest-marketing', type: 'INGESTS_FROM' },
      { id: 'ingest-marketing-to-bronze', from: 'ingest-marketing', to: 'bronze-marketing', type: 'WRITES_TO' },
      { id: 'map-marketing-reads', from: 'bronze-marketing', to: 'mapping-marketing', type: 'READS_FROM' },
      { id: 'map-marketing-writes', from: 'mapping-marketing', to: 'silver-marketing', type: 'WRITES_TO' },
      { id: 'taskflow-reads-silver', from: 'silver-core', to: 'taskflow-gold', type: 'READS_FROM' },
      { id: 'taskflow-reads-marketing', from: 'silver-marketing', to: 'taskflow-gold', type: 'READS_FROM' },
      { id: 'taskflow-writes-gold', from: 'taskflow-gold', to: 'gold-mart', type: 'WRITES_TO' },
      { id: 'gold-delivers-bi', from: 'gold-mart', to: 'powerbi', type: 'DELIVERS_TO' },
    ],
  },
  '2024-03-01T00:00:00Z': {
    nodes: [
      { id: 'ext-salesforce', label: 'ExternalSystem', name: 'Salesforce', type: 'SaaS' },
      { id: 'bronze-landing', label: 'Dataset', name: 'Landing Bucket', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'ingest-oppty', label: 'Pipeline', name: 'Opportunity Ingestion', type: 'Ingestion' },
      { id: 'silver-core', label: 'Dataset', name: 'Opportunity Core', layer: 'Silver', type: 'Table' },
      { id: 'mapping-core', label: 'Pipeline', name: 'Opportunity Mapping', type: 'Mapping' },
      { id: 'gold-mart', label: 'Dataset', name: 'Opportunity Gold Mart', layer: 'Gold', type: 'DataMart' },
      { id: 'taskflow-gold', label: 'Pipeline', name: 'Gold Builder', type: 'Taskflow' },
      { id: 'powerbi', label: 'BIApp', name: 'Power BI', type: 'PowerBI' },
      { id: 'ext-marketing', label: 'ExternalSystem', name: 'Marketing Hub', type: 'SaaS' },
      { id: 'ingest-marketing', label: 'Pipeline', name: 'Marketing Ingestion', type: 'Ingestion' },
      { id: 'bronze-marketing', label: 'Dataset', name: 'Marketing Landing', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'mapping-marketing', label: 'Pipeline', name: 'Marketing Modeling', type: 'Mapping' },
      { id: 'silver-marketing', label: 'Dataset', name: 'Marketing Core', layer: 'Silver', type: 'Table' },
      { id: 'oci-bronze-orders', label: 'Dataset', name: 'OCI Object Storage - Orders', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'oci-bronze-usage', label: 'Dataset', name: 'OCI Object Storage - Usage', layer: 'Bronze', type: 'ObjectStorage' },
      { id: 'adw-load-orders', label: 'Pipeline', name: 'ADW Load Orders', type: 'Load' },
      { id: 'adw-load-usage', label: 'Pipeline', name: 'ADW Load Usage', type: 'Load' },
      { id: 'adw-silver-orders', label: 'Dataset', name: 'ADW Orders Table', layer: 'Silver', type: 'Table' },
      { id: 'adw-silver-usage', label: 'Dataset', name: 'ADW Usage Table', layer: 'Silver', type: 'Table' },
      { id: 'adw-join-sales-usage', label: 'Pipeline', name: 'ADW Sales & Usage Join', type: 'SQLJoin' },
      { id: 'adw-gold-sales', label: 'Dataset', name: 'ADW Sales Intelligence', layer: 'Gold', type: 'Table' },
      { id: 'tableau-sales', label: 'BIApp', name: 'Tableau', type: 'Tableau' },
    ],
    edges: [
      { id: 'ext-to-ingest', from: 'ext-salesforce', to: 'ingest-oppty', type: 'INGESTS_FROM' },
      { id: 'ingest-to-bronze', from: 'ingest-oppty', to: 'bronze-landing', type: 'WRITES_TO' },
      { id: 'map-reads-bronze', from: 'bronze-landing', to: 'mapping-core', type: 'READS_FROM' },
      { id: 'map-writes-silver', from: 'mapping-core', to: 'silver-core', type: 'WRITES_TO' },
      { id: 'ext-marketing-to-ingest', from: 'ext-marketing', to: 'ingest-marketing', type: 'INGESTS_FROM' },
      { id: 'ingest-marketing-to-bronze', from: 'ingest-marketing', to: 'bronze-marketing', type: 'WRITES_TO' },
      { id: 'map-marketing-reads', from: 'bronze-marketing', to: 'mapping-marketing', type: 'READS_FROM' },
      { id: 'map-marketing-writes', from: 'mapping-marketing', to: 'silver-marketing', type: 'WRITES_TO' },
      { id: 'taskflow-reads-silver', from: 'silver-core', to: 'taskflow-gold', type: 'READS_FROM' },
      { id: 'taskflow-reads-marketing', from: 'silver-marketing', to: 'taskflow-gold', type: 'READS_FROM' },
      { id: 'taskflow-writes-gold', from: 'taskflow-gold', to: 'gold-mart', type: 'WRITES_TO' },
      { id: 'gold-delivers-bi', from: 'gold-mart', to: 'powerbi', type: 'DELIVERS_TO' },
      { id: 'orders-read-bronze', from: 'oci-bronze-orders', to: 'adw-load-orders', type: 'READS_FROM' },
      { id: 'orders-write-silver', from: 'adw-load-orders', to: 'adw-silver-orders', type: 'WRITES_TO' },
      { id: 'usage-read-bronze', from: 'oci-bronze-usage', to: 'adw-load-usage', type: 'READS_FROM' },
      { id: 'usage-write-silver', from: 'adw-load-usage', to: 'adw-silver-usage', type: 'WRITES_TO' },
      { id: 'adw-join-reads-orders', from: 'adw-silver-orders', to: 'adw-join-sales-usage', type: 'READS_FROM' },
      { id: 'adw-join-reads-usage', from: 'adw-silver-usage', to: 'adw-join-sales-usage', type: 'READS_FROM' },
      { id: 'adw-join-writes-gold', from: 'adw-join-sales-usage', to: 'adw-gold-sales', type: 'WRITES_TO' },
      { id: 'tableau-reads-gold', from: 'adw-gold-sales', to: 'tableau-sales', type: 'DELIVERS_TO' },
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

function filterGraphByParams(snapshot, { rootId, depth = 10, direction = 'both' }) {
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
