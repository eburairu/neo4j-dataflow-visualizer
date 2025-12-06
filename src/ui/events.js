import { normalizeAuraUri, buildNeoVisConfig } from '../config/neo4j.js';
import {
  prepareRelationshipData,
  bindNodeSelection,
  captureOriginalData,
  restoreGraph,
  applySearchFilter,
  updateSearchFeedback,
} from '../graph/visualization.js';
import { logStatus } from './status.js';
import {
  showNodeDetails,
  clearNodeDetails,
  showRelationshipPopover,
  hideRelationshipPopover,
} from './details.js';

let viz;
let originalNodes = [];
let originalEdges = [];
let selectedRelationship = null;
let relationshipPopoverPosition = null;

const credentialsSection = document.getElementById('credentials');
const searchInput = document.getElementById('graph-search');
const searchFeedback = document.getElementById('search-feedback');
const searchClearButton = document.getElementById('search-clear');
const relationshipPopoverCloseBtn = document.getElementById('close-relationship-popover');
const closeNodeDetailsButton = document.getElementById('close-node-details');
const runButton = document.getElementById('runBtn');

function unselectAll() {
  if (viz?._network) {
    viz._network.unselectAll();
  }
}

function showEdgeWithPopover(edgeData, pointerDom) {
  selectedRelationship = edgeData;
  const fallbackPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  relationshipPopoverPosition = pointerDom || relationshipPopoverPosition || fallbackPosition;
  showRelationshipPopover(edgeData, relationshipPopoverPosition);
}

function clearRelationshipSelection() {
  selectedRelationship = null;
  relationshipPopoverPosition = null;
  hideRelationshipPopover();
}

async function run() {
  const uri = document.getElementById('uri').value.trim();
  const user = document.getElementById('user').value.trim();
  const password = document.getElementById('password').value.trim();
  const cypher = document.getElementById('cypher').value.trim();

  if (!uri || !user || !password || !cypher) {
    alert('Please fill in AuraDB URI, Username, Password, and Cypher.');
    return;
  }

  try {
    runButton.disabled = true;
    runButton.textContent = 'Running...';
    clearNodeDetails();
    clearRelationshipSelection();

    if (viz && typeof viz.clearNetwork === 'function') {
      viz.clearNetwork();
    }

    const { serverUrl, driverConfig } = normalizeAuraUri(uri, logStatus);
    const config = buildNeoVisConfig({ serverUrl, user, password });
    config.neo4j.driverConfig = driverConfig;

    const NeoVisGlobal = window.NeoVis?.default || window.NeoVis;
    if (!NeoVisGlobal) {
      throw new Error('NeoVis library is not available');
    }

    viz = new NeoVisGlobal(config);
    logStatus('Connecting to Neo4j AuraDB and rendering graph...');
    await viz.renderWithCypher(cypher);
    logStatus('Render completed.');

    prepareRelationshipData(viz);
    bindNodeSelection(viz, {
      onNodeSelect: (nodeData) => {
        showNodeDetails(nodeData);
        hideRelationshipPopover();
      },
      onEdgeSelect: (edgeData, pointerDom) => {
        showEdgeWithPopover(edgeData, pointerDom);
      },
      onBackground: () => {
        clearNodeDetails();
        clearRelationshipSelection();
      },
    });

    ({ nodes: originalNodes, edges: originalEdges } = captureOriginalData(viz));
    updateSearchFeedback(searchFeedback, '検索未実行', 'info');

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

if (runButton) {
  runButton.addEventListener('click', run);
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    applySearchFilter({
      viz,
      originalNodes,
      originalEdges,
      query: e.target.value,
      selectedRelationship,
      relationshipPosition: relationshipPopoverPosition,
      onPopoverShow: showEdgeWithPopover,
      onPopoverHide: clearRelationshipSelection,
      updateSearchFeedback: (message, tone) => updateSearchFeedback(searchFeedback, message, tone),
    });
  });
}

if (searchClearButton) {
  searchClearButton.addEventListener('click', () => {
    restoreGraph({
      viz,
      originalNodes,
      originalEdges,
      searchInput,
      selectedRelationship,
      relationshipPosition: relationshipPopoverPosition,
      onPopoverShow: showEdgeWithPopover,
      onPopoverHide: clearRelationshipSelection,
      updateSearchFeedback: (message, tone) => updateSearchFeedback(searchFeedback, message, tone),
    });
  });
}

if (relationshipPopoverCloseBtn) {
  relationshipPopoverCloseBtn.addEventListener('click', () => {
    clearRelationshipSelection();
    unselectAll();
  });
}

if (closeNodeDetailsButton) {
  closeNodeDetailsButton.addEventListener('click', () => {
    clearNodeDetails();
    unselectAll();
  });
}

export { run };
