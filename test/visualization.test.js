import { describe, expect, it, vi } from 'vitest';
import { applySearchFilter, restoreGraph } from '../src/graph/visualization.js';

class MockDataSet {
  constructor(items = []) {
    this.items = items.map((item) => ({ ...item }));
  }

  get(id) {
    if (id === undefined) {
      return this.items.map((item) => ({ ...item }));
    }
    return this.items.find((item) => item.id === id);
  }

  add(items) {
    this.items.push(...items.map((item) => ({ ...item })));
  }

  clear() {
    this.items = [];
  }

  update(items) {
    items.forEach((item) => {
      const index = this.items.findIndex((existing) => existing.id === item.id);
      if (index >= 0) {
        this.items[index] = { ...item };
      } else {
        this.items.push({ ...item });
      }
    });
  }
}

const baseNodes = [
  { id: 'n1', label: 'Person', name: 'Alice', color: { background: '#fff', border: '#000' } },
  { id: 'n2', label: 'Person', name: 'Bob' },
  { id: 'n3', label: 'City', name: 'Paris' },
];

const baseEdges = [
  { id: 'e1', from: 'n1', to: 'n2', type: 'KNOWS', color: { color: '#999' } },
  { id: 'e2', from: 'n2', to: 'n3', type: 'LIVES_IN' },
];

function createMockViz(nodes = baseNodes, edges = baseEdges) {
  return {
    _data: {
      nodes: new MockDataSet(nodes),
      edges: new MockDataSet(edges),
    },
  };
}

describe('applySearchFilter', () => {
  it('highlights hits, hides non-matching items, and shows popover when edge remains visible', () => {
    const viz = createMockViz();
    const onPopoverShow = vi.fn();
    const onPopoverHide = vi.fn();
    const updateSearchFeedback = vi.fn();

    applySearchFilter({
      viz,
      originalNodes: baseNodes,
      originalEdges: baseEdges,
      query: 'alice',
      selectedRelationship: baseEdges[0],
      relationshipPosition: { x: 100, y: 50 },
      onPopoverShow,
      onPopoverHide,
      updateSearchFeedback,
    });

    const nodes = viz._data.nodes.get();
    const edges = viz._data.edges.get();

    const alice = nodes.find((node) => node.id === 'n1');
    const bob = nodes.find((node) => node.id === 'n2');
    const paris = nodes.find((node) => node.id === 'n3');

    expect(alice.hidden).toBe(false);
    expect(alice.color).toEqual({ background: '#fde68a', border: '#d97706' });
    expect(bob.hidden).toBe(false);
    expect(bob.color).toBeUndefined();
    expect(paris.hidden).toBe(true);
    expect(paris.color).toBeUndefined();

    const highlightedEdge = edges.find((edge) => edge.id === 'e1');
    const hiddenEdge = edges.find((edge) => edge.id === 'e2');

    expect(highlightedEdge.hidden).toBe(false);
    expect(highlightedEdge.color).toEqual({ color: '#d97706' });
    expect(hiddenEdge.hidden).toBe(true);

    expect(onPopoverShow).toHaveBeenCalledWith(highlightedEdge, { x: 100, y: 50 });
    expect(onPopoverHide).not.toHaveBeenCalled();
    expect(updateSearchFeedback).toHaveBeenCalledWith('ヒット件数: ノード 1 件 / リレーション 1 件');
  });

  it('hides popover when selected relationship is filtered out', () => {
    const viz = createMockViz();
    const onPopoverShow = vi.fn();
    const onPopoverHide = vi.fn();

    applySearchFilter({
      viz,
      originalNodes: baseNodes,
      originalEdges: baseEdges,
      query: 'Paris',
      selectedRelationship: baseEdges[0],
      relationshipPosition: { x: 0, y: 0 },
      onPopoverShow,
      onPopoverHide,
    });

    expect(onPopoverShow).not.toHaveBeenCalled();
    expect(onPopoverHide).toHaveBeenCalledTimes(1);
  });
});

describe('restoreGraph', () => {
  it('restores original data, clears search input, and replays popover visibility', () => {
    const viz = createMockViz();
    const searchInput = { value: 'bob' };
    const onPopoverShow = vi.fn();
    const onPopoverHide = vi.fn();
    const updateSearchFeedback = vi.fn();

    applySearchFilter({
      viz,
      originalNodes: baseNodes,
      originalEdges: baseEdges,
      query: 'alice',
    });

    restoreGraph({
      viz,
      originalNodes: baseNodes,
      originalEdges: baseEdges,
      searchInput,
      selectedRelationship: { id: 'unknown' },
      relationshipPosition: { x: 1, y: 2 },
      onPopoverShow,
      onPopoverHide,
      updateSearchFeedback,
    });

    expect(searchInput.value).toBe('');
    expect(viz._data.nodes.get()).toEqual(baseNodes);
    expect(viz._data.edges.get()).toEqual(baseEdges);
    expect(onPopoverShow).not.toHaveBeenCalled();
    expect(onPopoverHide).toHaveBeenCalledTimes(1);
    expect(updateSearchFeedback).toHaveBeenCalledWith('検索未実行', 'info');
  });
});
