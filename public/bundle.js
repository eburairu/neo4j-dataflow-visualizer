(() => {
  // src/config/neo4j.js
  var DEFAULT_DRIVER_CONFIG = {
    encrypted: "ENCRYPTION_ON",
    trust: "TRUST_SYSTEM_CA_SIGNED_CERTIFICATES"
  };
  function normalizeAuraUri(rawUri, logger = () => {
  }) {
    const trimmed = rawUri.trim();
    const driverConfig = { ...DEFAULT_DRIVER_CONFIG };
    const securePattern = /^(neo4j|bolt)\+ss?c?:\/\//i;
    if (securePattern.test(trimmed)) {
      const normalizedUri = trimmed.replace(/^(neo4j|bolt)\+ss?c?:\/\//i, "$1://");
      logger("\u6697\u53F7\u5316\u8A2D\u5B9A\u3092URL\u304B\u3089driverConfig\u306B\u79FB\u52D5\u3057\u307E\u3057\u305F\u3002");
      return { serverUrl: normalizedUri, driverConfig };
    }
    try {
      const url = new URL(trimmed);
      const hostname = url.hostname?.toLowerCase();
      const isAuraHost = hostname.endsWith(".databases.neo4j.io");
      const protocol = url.protocol.replace(":", "").toLowerCase();
      if (isAuraHost && (protocol === "neo4j" || protocol === "bolt")) {
        const upgraded = `neo4j+s://${url.host}${url.pathname}${url.search}${url.hash}`;
        logger("Aura\u30DB\u30B9\u30C8\u306EURI\u3092TLS\u4ED8\u304D\u306Eneo4j+s\u30B9\u30AD\u30FC\u30E0\u306B\u81EA\u52D5\u5909\u63DB\u3057\u307E\u3057\u305F\u3002");
        return { serverUrl: upgraded, driverConfig };
      }
    } catch (e) {
    }
    const auraHostOnly = /^(\w[\w.-]*\.databases\.neo4j\.io)(?::\d+)?(\/.*)?$/i;
    if (auraHostOnly.test(trimmed)) {
      logger("Aura\u30DB\u30B9\u30C8\u540D\u306BTLS\u30B9\u30AD\u30FC\u30E0\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F (neo4j+s://)\u3002");
      return { serverUrl: `neo4j+s://${trimmed}`, driverConfig };
    }
    return { serverUrl: trimmed, driverConfig };
  }
  function buildNeoVisConfig({ serverUrl, user, password }) {
    return {
      containerId: "viz",
      neo4j: {
        serverUrl,
        serverUser: user,
        serverPassword: password,
        driverConfig: { ...DEFAULT_DRIVER_CONFIG }
      },
      labels: {},
      relationships: {},
      visConfig: {
        layout: {
          hierarchical: {
            enabled: true,
            direction: "LR",
            sortMethod: "directed"
          }
        },
        nodes: {
          shape: "dot",
          size: 16
        },
        edges: {
          arrows: {
            to: { enabled: true }
          }
        },
        physics: {
          enabled: false,
          hierarchicalRepulsion: {
            nodeDistance: 180,
            avoidOverlap: 1
          }
        }
      }
    };
  }

  // src/graph/visualization.js
  function normalizeRelationshipEdge(edge) {
    if (!edge || typeof edge !== "object") return edge;
    return {
      ...edge,
      type: edge.type || edge.label || edge.caption || edge.relationshipType || "Relationship",
      direction: edge.direction || `${edge.from ?? "?"} \u2192 ${edge.to ?? "?"}`,
      properties: edge.properties || edge.data || edge.attributes || {}
    };
  }
  function prepareRelationshipData(viz2) {
    if (!viz2?._data?.edges) return;
    const normalized = viz2._data.edges.get().map(normalizeRelationshipEdge);
    viz2._data.edges.update(normalized);
  }
  function bindNodeSelection(viz2, { onNodeSelect, onEdgeSelect, onBackground }) {
    if (!viz2 || !viz2._network) return;
    const network = viz2._network;
    const handler = (params) => {
      const pointerDom = params?.pointer?.DOM;
      if (params?.edges?.length) {
        const edgeId = params.edges[0];
        const edgeData = viz2?._data?.edges?.get?.(edgeId);
        if (edgeData) {
          onEdgeSelect?.(edgeData, pointerDom);
        }
        return;
      }
      if (params?.nodes?.length) {
        const nodeId = params.nodes[0];
        const nodeData = viz2?._data?.nodes?.get?.(nodeId) || { id: nodeId };
        onNodeSelect?.(nodeData);
      } else {
        onBackground?.();
      }
    };
    network.off("click");
    network.on("click", handler);
  }
  function captureOriginalData(viz2) {
    if (!viz2?._data?.nodes || !viz2?._data?.edges) {
      return { nodes: [], edges: [] };
    }
    return {
      nodes: JSON.parse(JSON.stringify(viz2._data.nodes.get())),
      edges: JSON.parse(JSON.stringify(viz2._data.edges.get()))
    };
  }
  function restoreGraph({
    viz: viz2,
    originalNodes: originalNodes2,
    originalEdges: originalEdges2,
    searchInput: searchInput2,
    selectedRelationship: selectedRelationship2,
    relationshipPosition,
    onPopoverShow,
    onPopoverHide,
    updateSearchFeedback: updateSearchFeedback2
  }) {
    if (!viz2?._data?.nodes || !viz2?._data?.edges) return;
    viz2._data.nodes.clear();
    viz2._data.edges.clear();
    viz2._data.nodes.add(originalNodes2);
    viz2._data.edges.add(originalEdges2);
    updateSearchFeedback2?.("\u691C\u7D22\u672A\u5B9F\u884C", "info");
    if (searchInput2) searchInput2.value = "";
    if (selectedRelationship2) {
      const restored = viz2._data.edges.get().find((edge) => edge.id === selectedRelationship2.id);
      if (restored) {
        onPopoverShow?.(restored, relationshipPosition);
      } else {
        onPopoverHide?.();
      }
    }
  }
  function matchesEntity(entity, query) {
    if (!entity || !query) return false;
    const target = JSON.stringify(entity).toLowerCase();
    return target.includes(query.toLowerCase());
  }
  function applySearchFilter({
    viz: viz2,
    originalNodes: originalNodes2,
    originalEdges: originalEdges2,
    query,
    selectedRelationship: selectedRelationship2,
    relationshipPosition,
    onPopoverShow,
    onPopoverHide,
    updateSearchFeedback: updateSearchFeedback2
  }) {
    if (!viz2?._data?.nodes || !viz2?._data?.edges) {
      updateSearchFeedback2?.("\u30B0\u30E9\u30D5\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093\u3002", "warn");
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) {
      restoreGraph({
        viz: viz2,
        originalNodes: originalNodes2,
        originalEdges: originalEdges2,
        searchInput: null,
        selectedRelationship: selectedRelationship2,
        relationshipPosition,
        onPopoverShow,
        onPopoverHide,
        updateSearchFeedback: updateSearchFeedback2
      });
      return;
    }
    const matchedNodeIds = /* @__PURE__ */ new Set();
    const matchedEdgeIds = /* @__PURE__ */ new Set();
    const nodesFromEdges = /* @__PURE__ */ new Set();
    originalNodes2.forEach((node) => {
      if (matchesEntity(node, trimmed)) {
        matchedNodeIds.add(node.id);
      }
    });
    originalEdges2.forEach((edge) => {
      const edgeId = edge.id ?? `${edge.from}-${edge.to}`;
      const edgeMatch = matchesEntity(edge, trimmed);
      if (edgeMatch) {
        matchedEdgeIds.add(edgeId);
        nodesFromEdges.add(edge.from);
        nodesFromEdges.add(edge.to);
      }
      if (matchedNodeIds.has(edge.from) || matchedNodeIds.has(edge.to)) {
        matchedEdgeIds.add(edgeId);
        nodesFromEdges.add(edge.from);
        nodesFromEdges.add(edge.to);
      }
    });
    const nodesToShow = /* @__PURE__ */ new Set([...matchedNodeIds, ...nodesFromEdges]);
    const filteredNodes = originalNodes2.map((node) => ({
      ...node,
      hidden: !nodesToShow.has(node.id),
      color: nodesToShow.has(node.id) && matchedNodeIds.has(node.id) ? { background: "#fde68a", border: "#d97706" } : node.color
    }));
    const filteredEdges = originalEdges2.map((edge) => {
      const edgeId = edge.id ?? `${edge.from}-${edge.to}`;
      const isMatch = matchedEdgeIds.has(edgeId);
      return {
        ...edge,
        hidden: !isMatch,
        color: isMatch ? { color: "#d97706" } : edge.color
      };
    });
    viz2._data.nodes.clear();
    viz2._data.edges.clear();
    viz2._data.nodes.add(filteredNodes);
    viz2._data.edges.add(filteredEdges);
    if (selectedRelationship2) {
      const filteredEdge = filteredEdges.find((edge) => edge.id === selectedRelationship2.id);
      if (filteredEdge && !filteredEdge.hidden) {
        onPopoverShow?.(filteredEdge, relationshipPosition);
      } else {
        onPopoverHide?.();
      }
    }
    const hitCount = matchedNodeIds.size + matchedEdgeIds.size;
    if (hitCount === 0) {
      updateSearchFeedback2?.("\u8A72\u5F53\u306A\u3057\uFF1A\u6761\u4EF6\u306B\u4E00\u81F4\u3059\u308B\u30CE\u30FC\u30C9/\u30EA\u30EC\u30FC\u30B7\u30E7\u30F3\u306F\u3042\u308A\u307E\u305B\u3093\u3002", "warn");
    } else {
      updateSearchFeedback2?.(`\u30D2\u30C3\u30C8\u4EF6\u6570: \u30CE\u30FC\u30C9 ${matchedNodeIds.size} \u4EF6 / \u30EA\u30EC\u30FC\u30B7\u30E7\u30F3 ${matchedEdgeIds.size} \u4EF6`);
    }
  }
  function updateSearchFeedback(searchFeedbackEl, message, tone = "info") {
    if (!searchFeedbackEl) return;
    const color = tone === "warn" ? "#fffbeb" : "#e0f2fe";
    const textColor = tone === "warn" ? "#92400e" : "#0b2948";
    searchFeedbackEl.textContent = message;
    searchFeedbackEl.style.background = color;
    searchFeedbackEl.style.color = textColor;
  }

  // src/ui/status.js
  function logStatus(message, statusEl = document.getElementById("status")) {
    if (!statusEl) return;
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const entry = document.createElement("div");
    entry.textContent = `[${time}] ${message}`;
    statusEl.appendChild(entry);
    statusEl.scrollTop = statusEl.scrollHeight;
  }

  // src/ui/details.js
  var nodePanel = document.getElementById("node-details-panel");
  var nodeIdEl = document.getElementById("node-id");
  var nodeLabelEl = document.getElementById("node-label");
  var nodePropsEl = document.getElementById("node-properties");
  var relationshipPopover = document.getElementById("relationship-popover");
  var relationshipTypeEl = document.getElementById("relationship-type");
  var relationshipDirectionEl = document.getElementById("relationship-direction");
  var relationshipFromEl = document.getElementById("relationship-from");
  var relationshipToEl = document.getElementById("relationship-to");
  var relationshipPropsEl = document.getElementById("relationship-properties");
  function formatProperties(properties) {
    if (!properties || typeof properties !== "object") {
      return "-";
    }
    const entries = Object.entries(properties);
    if (entries.length === 0) {
      return "-";
    }
    return entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
  }
  function formatRelationshipData(edgeData) {
    if (!edgeData) {
      return {
        type: "-",
        direction: "-",
        from: "-",
        to: "-",
        properties: "-"
      };
    }
    return {
      type: edgeData.type || edgeData.label || edgeData.caption || "Relationship",
      direction: edgeData.direction || `${edgeData.from ?? "?"} \u2192 ${edgeData.to ?? "?"}`,
      from: edgeData.from ?? "-",
      to: edgeData.to ?? "-",
      properties: formatProperties(edgeData.properties)
    };
  }
  function showNodeDetails(nodeData) {
    if (!nodePanel) return;
    const labelText = nodeData.labels && nodeData.labels.length ? nodeData.labels.join(", ") : nodeData.label || "-";
    nodeIdEl.textContent = nodeData.id ?? "-";
    nodeLabelEl.textContent = labelText;
    nodePropsEl.textContent = formatProperties(nodeData.properties);
    nodePanel.hidden = false;
    hideRelationshipPopover();
  }
  function clearNodeDetails() {
    if (!nodePanel) return;
    nodeIdEl.textContent = "-";
    nodeLabelEl.textContent = "-";
    nodePropsEl.textContent = "-";
    nodePanel.hidden = true;
  }
  function hideRelationshipPopover() {
    if (relationshipPopover) {
      relationshipPopover.hidden = true;
    }
  }
  function showRelationshipPopover(edgeData, pointerDom) {
    if (!relationshipPopover || !edgeData) return;
    const formatted = formatRelationshipData(edgeData);
    relationshipTypeEl.textContent = formatted.type;
    relationshipDirectionEl.textContent = formatted.direction;
    relationshipFromEl.textContent = formatted.from;
    relationshipToEl.textContent = formatted.to;
    relationshipPropsEl.textContent = formatted.properties;
    if (pointerDom) {
      relationshipPopover.style.left = `${pointerDom.x}px`;
      relationshipPopover.style.top = `${pointerDom.y}px`;
    }
    relationshipPopover.hidden = false;
  }

  // src/ui/events.js
  var viz;
  var originalNodes = [];
  var originalEdges = [];
  var selectedRelationship = null;
  var relationshipPopoverPosition = null;
  var credentialsSection = document.getElementById("credentials");
  var searchInput = document.getElementById("graph-search");
  var searchFeedback = document.getElementById("search-feedback");
  var searchClearButton = document.getElementById("search-clear");
  var relationshipPopoverCloseBtn = document.getElementById("close-relationship-popover");
  var closeNodeDetailsButton = document.getElementById("close-node-details");
  var runButton = document.getElementById("runBtn");
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
    const uri = document.getElementById("uri").value.trim();
    const user = document.getElementById("user").value.trim();
    const password = document.getElementById("password").value.trim();
    const cypher = document.getElementById("cypher").value.trim();
    if (!uri || !user || !password || !cypher) {
      alert("Please fill in AuraDB URI, Username, Password, and Cypher.");
      return;
    }
    try {
      runButton.disabled = true;
      runButton.textContent = "Running...";
      clearNodeDetails();
      clearRelationshipSelection();
      if (viz && typeof viz.clearNetwork === "function") {
        viz.clearNetwork();
      }
      const { serverUrl, driverConfig } = normalizeAuraUri(uri, logStatus);
      const config = buildNeoVisConfig({ serverUrl, user, password });
      config.neo4j.driverConfig = driverConfig;
      const NeoVisGlobal = window.NeoVis?.default || window.NeoVis;
      if (!NeoVisGlobal) {
        throw new Error("NeoVis library is not available");
      }
      viz = new NeoVisGlobal(config);
      logStatus("Connecting to Neo4j AuraDB and rendering graph...");
      await viz.renderWithCypher(cypher);
      logStatus("Render completed.");
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
        }
      });
      ({ nodes: originalNodes, edges: originalEdges } = captureOriginalData(viz));
      updateSearchFeedback(searchFeedback, "\u691C\u7D22\u672A\u5B9F\u884C", "info");
      if (credentialsSection) {
        credentialsSection.open = false;
      }
    } catch (e) {
      console.error(e);
      logStatus("\u30A8\u30E9\u30FC: " + e.message);
      alert("Failed to run visualization: " + e.message);
    } finally {
      runButton.disabled = false;
      runButton.textContent = "Run & Visualize";
    }
  }
  if (runButton) {
    runButton.addEventListener("click", run);
  }
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      applySearchFilter({
        viz,
        originalNodes,
        originalEdges,
        query: e.target.value,
        selectedRelationship,
        relationshipPosition: relationshipPopoverPosition,
        onPopoverShow: showEdgeWithPopover,
        onPopoverHide: clearRelationshipSelection,
        updateSearchFeedback: (message, tone) => updateSearchFeedback(searchFeedback, message, tone)
      });
    });
  }
  if (searchClearButton) {
    searchClearButton.addEventListener("click", () => {
      restoreGraph({
        viz,
        originalNodes,
        originalEdges,
        searchInput,
        selectedRelationship,
        relationshipPosition: relationshipPopoverPosition,
        onPopoverShow: showEdgeWithPopover,
        onPopoverHide: clearRelationshipSelection,
        updateSearchFeedback: (message, tone) => updateSearchFeedback(searchFeedback, message, tone)
      });
    });
  }
  if (relationshipPopoverCloseBtn) {
    relationshipPopoverCloseBtn.addEventListener("click", () => {
      clearRelationshipSelection();
      unselectAll();
    });
  }
  if (closeNodeDetailsButton) {
    closeNodeDetailsButton.addEventListener("click", () => {
      clearNodeDetails();
      unselectAll();
    });
  }
})();
