// NeoVis instance reference
let viz;
let selectedNode = null;
let selectionHandler = null;
let selectedRelationship = null;
let relationshipPopoverPosition = null;
let originalNodes = [];
let originalEdges = [];
let searchQuery = '';

// UI references for folding credentials
const credentialsSection = document.getElementById('credentials');
const searchInput = document.getElementById('graph-search');
const searchFeedback = document.getElementById('search-feedback');
const searchClearButton = document.getElementById('search-clear');
const relationshipPopover = document.getElementById('relationship-popover');
const closeRelationshipPopoverBtn = document.getElementById('close-relationship-popover');
const relationshipTypeEl = document.getElementById('relationship-type');
const relationshipDirectionEl = document.getElementById('relationship-direction');
const relationshipFromEl = document.getElementById('relationship-from');
const relationshipToEl = document.getElementById('relationship-to');
const relationshipPropsEl = document.getElementById('relationship-properties');

/**
 * Append a timestamped log message to the status panel.
 * @param {string} message
 */
function logStatus(message) {
  const statusEl = document.getElementById('status');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.textContent = `[${time}] ${message}`;
  statusEl.appendChild(entry);
  statusEl.scrollTop = statusEl.scrollHeight;
}

/**
 * Render selected node details into the panel.
 * @param {{id: string|number, label?: string, labels?: string[], properties?: object}} nodeData
 */
function showNodeDetails(nodeData) {
  selectedNode = nodeData;
  const panel = document.getElementById('node-details-panel');
  const idEl = document.getElementById('node-id');
  const labelEl = document.getElementById('node-label');
  const propsEl = document.getElementById('node-properties');

  const labelText = (nodeData.labels && nodeData.labels.length)
    ? nodeData.labels.join(', ')
    : nodeData.label || '-';

  idEl.textContent = nodeData.id ?? '-';
  labelEl.textContent = labelText;
  propsEl.textContent = formatProperties(nodeData.properties);

  panel.hidden = false;
  hideRelationshipPopover();
}

function clearNodeDetails() {
  selectedNode = null;
  const panel = document.getElementById('node-details-panel');
  const idEl = document.getElementById('node-id');
  const labelEl = document.getElementById('node-label');
  const propsEl = document.getElementById('node-properties');

  idEl.textContent = '-';
  labelEl.textContent = '-';
  propsEl.textContent = '-';
  panel.hidden = true;
}

function formatProperties(properties) {
  if (!properties || typeof properties !== 'object') {
    return '-';
  }

  const entries = Object.entries(properties);
  if (entries.length === 0) {
    return '-';
  }

  return entries
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

function formatRelationshipData(edgeData) {
  if (!edgeData) {
    return {
      type: '-',
      direction: '-',
      from: '-',
      to: '-',
      properties: '-',
    };
  }

  return {
    type: edgeData.type || edgeData.label || edgeData.caption || 'Relationship',
    direction: edgeData.direction || `${edgeData.from ?? '?'} → ${edgeData.to ?? '?'}`,
    from: edgeData.from ?? '-',
    to: edgeData.to ?? '-',
    properties: formatProperties(edgeData.properties),
  };
}

function hideRelationshipPopover() {
  selectedRelationship = null;
  relationshipPopoverPosition = null;
  if (relationshipPopover) {
    relationshipPopover.hidden = true;
  }
}

function showRelationshipPopover(edgeData, pointerDom) {
  if (!relationshipPopover || !edgeData) return;

  selectedRelationship = edgeData;
  const fallbackPosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  relationshipPopoverPosition = pointerDom || relationshipPopoverPosition || fallbackPosition;

  const formatted = formatRelationshipData(edgeData);
  relationshipTypeEl.textContent = formatted.type;
  relationshipDirectionEl.textContent = formatted.direction;
  relationshipFromEl.textContent = formatted.from;
  relationshipToEl.textContent = formatted.to;
  relationshipPropsEl.textContent = formatted.properties;

  if (relationshipPopoverPosition) {
    relationshipPopover.style.left = `${relationshipPopoverPosition.x}px`;
    relationshipPopover.style.top = `${relationshipPopoverPosition.y}px`;
  }

  relationshipPopover.hidden = false;
}

function normalizeRelationshipEdge(edge) {
  if (!edge || typeof edge !== 'object') return edge;
  return {
    ...edge,
    type: edge.type || edge.label || edge.caption || edge.relationshipType || 'Relationship',
    direction: edge.direction || `${edge.from ?? '?'} → ${edge.to ?? '?'}`,
    properties: edge.properties || edge.data || edge.attributes || {},
  };
}

function prepareRelationshipData() {
  if (!viz?._data?.edges) return;
  const normalized = viz._data.edges.get().map(normalizeRelationshipEdge);
  viz._data.edges.update(normalized);
}

function bindNodeSelection() {
  if (!viz || !viz._network) return;

  const network = viz._network;
  if (selectionHandler) {
    network.off('click', selectionHandler);
  }

  selectionHandler = (params) => {
    const pointerDom = params?.pointer?.DOM;

    if (params?.edges?.length) {
      const edgeId = params.edges[0];
      const edgeData = viz?._data?.edges?.get?.(edgeId);
      if (edgeData) {
        showRelationshipPopover(edgeData, pointerDom);
      }
      return;
    }

    if (params?.nodes?.length) {
      const nodeId = params.nodes[0];
      const nodeData = viz?._data?.nodes?.get?.(nodeId) || { id: nodeId };
      showNodeDetails(nodeData);
    } else {
      clearNodeDetails();
      hideRelationshipPopover();
    }
  };

  network.on('click', selectionHandler);
}

function captureOriginalData() {
  if (!viz?._data?.nodes || !viz?._data?.edges) return;

  originalNodes = JSON.parse(JSON.stringify(viz._data.nodes.get()));
  originalEdges = JSON.parse(JSON.stringify(viz._data.edges.get()));
}

function restoreGraph() {
  if (!viz?._data?.nodes || !viz?._data?.edges) return;

  viz._data.nodes.clear();
  viz._data.edges.clear();
  viz._data.nodes.add(originalNodes);
  viz._data.edges.add(originalEdges);
  updateSearchFeedback('検索未実行', 'info');
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  if (selectedRelationship) {
    const restored = viz._data.edges.get().find((edge) => edge.id === selectedRelationship.id);
    if (restored) {
      showRelationshipPopover(restored, relationshipPopoverPosition);
    } else {
      hideRelationshipPopover();
    }
  }
}

function updateSearchFeedback(message, tone = 'info') {
  if (!searchFeedback) return;
  const color = tone === 'warn' ? '#fffbeb' : '#e0f2fe';
  const textColor = tone === 'warn' ? '#92400e' : '#0b2948';
  searchFeedback.textContent = message;
  searchFeedback.style.background = color;
  searchFeedback.style.color = textColor;
}

function matchesEntity(entity, query) {
  if (!entity || !query) return false;
  const target = JSON.stringify(entity).toLowerCase();
  return target.includes(query.toLowerCase());
}

function applySearchFilter(query) {
  if (!viz?._data?.nodes || !viz?._data?.edges) {
    updateSearchFeedback('グラフが読み込まれていません。', 'warn');
    return;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    restoreGraph();
    return;
  }

  searchQuery = trimmed;
  const matchedNodeIds = new Set();
  const matchedEdgeIds = new Set();
  const nodesFromEdges = new Set();

  originalNodes.forEach((node) => {
    if (matchesEntity(node, trimmed)) {
      matchedNodeIds.add(node.id);
    }
  });

  originalEdges.forEach((edge) => {
    const edgeMatch = matchesEntity(edge, trimmed);
    if (edgeMatch) {
      matchedEdgeIds.add(edge.id ?? `${edge.from}-${edge.to}`);
      nodesFromEdges.add(edge.from);
      nodesFromEdges.add(edge.to);
    }

    if (matchedNodeIds.has(edge.from) || matchedNodeIds.has(edge.to)) {
      matchedEdgeIds.add(edge.id ?? `${edge.from}-${edge.to}`);
      nodesFromEdges.add(edge.from);
      nodesFromEdges.add(edge.to);
    }
  });

  const nodesToShow = new Set([...matchedNodeIds, ...nodesFromEdges]);
  const filteredNodes = originalNodes.map((node) => ({
    ...node,
    hidden: !nodesToShow.has(node.id),
    color: nodesToShow.has(node.id) && matchedNodeIds.has(node.id)
      ? { background: '#fde68a', border: '#d97706' }
      : node.color,
  }));

  const filteredEdges = originalEdges.map((edge) => {
    const edgeId = edge.id ?? `${edge.from}-${edge.to}`;
    const isMatch = matchedEdgeIds.has(edgeId);
    return {
      ...edge,
      hidden: !isMatch,
      color: isMatch ? { color: '#d97706' } : edge.color,
    };
  });

  viz._data.nodes.clear();
  viz._data.edges.clear();
  viz._data.nodes.add(filteredNodes);
  viz._data.edges.add(filteredEdges);

  if (selectedRelationship) {
    const filteredEdge = filteredEdges.find((edge) => edge.id === selectedRelationship.id);
    if (filteredEdge && !filteredEdge.hidden) {
      showRelationshipPopover(filteredEdge, relationshipPopoverPosition);
    } else {
      hideRelationshipPopover();
    }
  }

  const hitCount = matchedNodeIds.size + matchedEdgeIds.size;
  if (hitCount === 0) {
    updateSearchFeedback('該当なし：条件に一致するノード/リレーションはありません。', 'warn');
  } else {
    updateSearchFeedback(`ヒット件数: ノード ${matchedNodeIds.size} 件 / リレーション ${matchedEdgeIds.size} 件`);
  }
}

/**
 * Normalize the user-supplied Aura URI without setting any encryption
 * options in driverConfig to avoid "Encryption/trust configured twice"
 * errors. If an Aura host is provided without a secure scheme, upgrade
 * it to `neo4j+s://` so TLS is still used.
 * @param {string} rawUri
 * @returns {{serverUrl: string, driverConfig: object}}
 */
function normalizeAuraUri(rawUri) {
  const trimmed = rawUri.trim();
  const driverConfig = {
    encrypted: 'ENCRYPTION_ON',
    trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
  };

  // Move any encryption/trust directives from the URI into driverConfig to
  // avoid the "Encryption/trust configured twice" error.
  const securePattern = /^(neo4j|bolt)\+ss?c?:\/\//i;
  if (securePattern.test(trimmed)) {
    const normalizedUri = trimmed.replace(/^(neo4j|bolt)\+ss?c?:\/\//i, '$1://');
    logStatus('暗号化設定をURLからdriverConfigに移動しました。');
    return { serverUrl: normalizedUri, driverConfig };
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname?.toLowerCase();
    const isAuraHost = hostname.endsWith('.databases.neo4j.io');
    const protocol = url.protocol.replace(':', '').toLowerCase();

    if (isAuraHost && (protocol === 'neo4j' || protocol === 'bolt')) {
      logStatus('Auraホストに接続します。暗号化はdriverConfigに設定します。');
      return { serverUrl: trimmed, driverConfig };
    }
  } catch (e) {
    // If the URL constructor fails, fall through and use the raw value.
  }

  return { serverUrl: trimmed, driverConfig };
}

/**
 * Create or re-create the visualization based on user input.
 */
async function run() {
  const uri = document.getElementById('uri').value.trim();
  const user = document.getElementById('user').value.trim();
  const password = document.getElementById('password').value.trim();
  const cypher = document.getElementById('cypher').value.trim();
  const runButton = document.getElementById('runBtn');

  if (!uri || !user || !password || !cypher) {
    alert('Please fill in AuraDB URI, Username, Password, and Cypher.');
    return;
  }

  try {
    runButton.disabled = true;
    runButton.textContent = 'Running...';
    clearNodeDetails();
    hideRelationshipPopover();

    // Clear previous visualization if it exists
    if (viz && typeof viz.clearNetwork === 'function') {
      viz.clearNetwork();
    }

    const { serverUrl, driverConfig } = normalizeAuraUri(uri);

    const config = {
      containerId: 'viz',
      neo4j: {
        serverUrl,
        serverUser: user,
        serverPassword: password,
        driverConfig,
      },
      labels: {},
      relationships: {},
      visConfig: {
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'LR',
            sortMethod: 'directed',
          },
        },
        nodes: {
          shape: 'dot',
          size: 16,
        },
        edges: {
          arrows: {
            to: { enabled: true },
          },
        },
        physics: {
          enabled: false,
          hierarchicalRepulsion: {
            nodeDistance: 180,
            avoidOverlap: 1,
          },
        },
      },
    };

    viz = new NeoVis.default(config);
    logStatus('Connecting to Neo4j AuraDB and rendering graph...');
    await viz.renderWithCypher(cypher);
    logStatus('Render completed.');

    prepareRelationshipData();
    bindNodeSelection();
    captureOriginalData();
    updateSearchFeedback('検索未実行', 'info');

    // 認証情報は実行後不要なので自動的に畳む
    if (credentialsSection) {
      credentialsSection.open = false;
    }
  } catch (e) {
    console.error(e);
    logStatus('エラー: ' + e.message);
    alert('Failed to run visualization: ' + e.message);
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run & Visualize';
  }
}

// Bind run handler
document.getElementById('runBtn').addEventListener('click', run);

// Bind search handlers
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    applySearchFilter(e.target.value);
  });
}

if (searchClearButton) {
  searchClearButton.addEventListener('click', () => {
    restoreGraph();
  });
}

if (closeRelationshipPopoverBtn) {
  closeRelationshipPopoverBtn.addEventListener('click', () => {
    hideRelationshipPopover();
    if (viz?._network) {
      viz._network.unselectAll();
    }
  });
}

// Bind clear handler for node details panel
document.getElementById('close-node-details').addEventListener('click', () => {
  clearNodeDetails();
  if (viz?._network) {
    viz._network.unselectAll();
  }
});

