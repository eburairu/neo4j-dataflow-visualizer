function normalizeRelationshipEdge(edge) {
  if (!edge || typeof edge !== 'object') return edge;
  return {
    ...edge,
    type: edge.type || edge.label || edge.caption || edge.relationshipType || 'Relationship',
    direction: edge.direction || `${edge.from ?? '?'} → ${edge.to ?? '?'}`,
    properties: edge.properties || edge.data || edge.attributes || {},
  };
}

export function prepareRelationshipData(viz) {
  if (!viz?._data?.edges) return;
  const normalized = viz._data.edges.get().map(normalizeRelationshipEdge);
  viz._data.edges.update(normalized);
}

export function bindNodeSelection(viz, { onNodeSelect, onEdgeSelect, onBackground }) {
  if (!viz || !viz._network) return;

  const network = viz._network;
  const handler = (params) => {
    const pointerDom = params?.pointer?.DOM;

    if (params?.edges?.length) {
      const edgeId = params.edges[0];
      const edgeData = viz?._data?.edges?.get?.(edgeId);
      if (edgeData) {
        onEdgeSelect?.(edgeData, pointerDom);
      }
      return;
    }

    if (params?.nodes?.length) {
      const nodeId = params.nodes[0];
      const nodeData = viz?._data?.nodes?.get?.(nodeId) || { id: nodeId };
      onNodeSelect?.(nodeData);
    } else {
      onBackground?.();
    }
  };

  network.off('click');
  network.on('click', handler);
}

export function captureOriginalData(viz) {
  if (!viz?._data?.nodes || !viz?._data?.edges) {
    return { nodes: [], edges: [] };
  }

  return {
    nodes: JSON.parse(JSON.stringify(viz._data.nodes.get())),
    edges: JSON.parse(JSON.stringify(viz._data.edges.get())),
  };
}

export function restoreGraph({
  viz,
  originalNodes,
  originalEdges,
  searchInput,
  selectedRelationship,
  relationshipPosition,
  onPopoverShow,
  onPopoverHide,
  updateSearchFeedback,
}) {
  if (!viz?._data?.nodes || !viz?._data?.edges) return;

  viz._data.nodes.clear();
  viz._data.edges.clear();
  viz._data.nodes.add(originalNodes);
  viz._data.edges.add(originalEdges);
  updateSearchFeedback?.('検索未実行', 'info');
  if (searchInput) searchInput.value = '';

  if (selectedRelationship) {
    const restored = viz._data.edges.get().find((edge) => edge.id === selectedRelationship.id);
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

export function applySearchFilter({
  viz,
  originalNodes,
  originalEdges,
  query,
  selectedRelationship,
  relationshipPosition,
  onPopoverShow,
  onPopoverHide,
  updateSearchFeedback,
}) {
  if (!viz?._data?.nodes || !viz?._data?.edges) {
    updateSearchFeedback?.('グラフが読み込まれていません。', 'warn');
    return;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    restoreGraph({
      viz,
      originalNodes,
      originalEdges,
      searchInput: null,
      selectedRelationship,
      relationshipPosition,
      onPopoverShow,
      onPopoverHide,
      updateSearchFeedback,
    });
    return;
  }

  const matchedNodeIds = new Set();
  const matchedEdgeIds = new Set();
  const nodesFromEdges = new Set();

  originalNodes.forEach((node) => {
    if (matchesEntity(node, trimmed)) {
      matchedNodeIds.add(node.id);
    }
  });

  originalEdges.forEach((edge) => {
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
      onPopoverShow?.(filteredEdge, relationshipPosition);
    } else {
      onPopoverHide?.();
    }
  }

  const hitCount = matchedNodeIds.size + matchedEdgeIds.size;
  if (hitCount === 0) {
    updateSearchFeedback?.('該当なし：条件に一致するノード/リレーションはありません。', 'warn');
  } else {
    updateSearchFeedback?.(`ヒット件数: ノード ${matchedNodeIds.size} 件 / リレーション ${matchedEdgeIds.size} 件`);
  }
}

export function updateSearchFeedback(searchFeedbackEl, message, tone = 'info') {
  if (!searchFeedbackEl) return;
  const color = tone === 'warn' ? '#fffbeb' : '#e0f2fe';
  const textColor = tone === 'warn' ? '#92400e' : '#0b2948';
  searchFeedbackEl.textContent = message;
  searchFeedbackEl.style.background = color;
  searchFeedbackEl.style.color = textColor;
}
