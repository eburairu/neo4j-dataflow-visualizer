const { sampleSnapshots, filterGraphByParams, diffSnapshots, searchSnapshot } = require('../src/data/sampleGraph');

describe('filterGraphByParams', () => {
  test('respects depth limit when traversing downstream', () => {
    const result = filterGraphByParams('2024-02-01T00:00:00Z', {
      rootId: 'ingest-oppty',
      depth: 1,
      direction: 'down',
    });

    const nodeIds = result.nodes.map((node) => node.id);
    expect(nodeIds).toEqual(expect.arrayContaining(['ingest-oppty', 'bronze-landing']));
    expect(nodeIds).not.toContain('mapping-core');

    const edgeIds = result.edges.map((edge) => edge.id);
    expect(edgeIds).toEqual(['ingest-to-bronze']);
  });

  test('walks upstream only and stops at depth boundary', () => {
    const result = filterGraphByParams('2024-02-01T00:00:00Z', {
      rootId: 'silver-core',
      depth: 2,
      direction: 'up',
    });

    const nodeIds = result.nodes.map((node) => node.id);
    expect(nodeIds.sort()).toEqual(['bronze-landing', 'mapping-core', 'silver-core'].sort());

    const edgeIds = result.edges.map((edge) => edge.id).sort();
    expect(edgeIds).toEqual(['map-reads-bronze', 'map-writes-silver'].sort());
  });
});

describe('diffSnapshots', () => {
  test('detects added and removed artifacts between snapshots', () => {
    const diff = diffSnapshots('2024-01-01T00:00:00Z', '2024-02-01T00:00:00Z');

    expect(diff.nodes.added.map((node) => node.id).sort()).toEqual(
      ['gold-mart', 'powerbi', 'taskflow-gold'].sort()
    );
    expect(diff.nodes.removed).toHaveLength(0);
    expect(diff.edges.added.map((edge) => edge.id).sort()).toEqual(
      ['gold-delivers-bi', 'taskflow-reads-marketing', 'taskflow-reads-silver', 'taskflow-writes-gold'].sort()
    );
    expect(diff.edges.removed).toHaveLength(0);
  });
});

describe('searchSnapshot', () => {
  test('supports partial, case-insensitive matching for nodes and edges', () => {
    const result = searchSnapshot('2024-03-01T00:00:00Z', 'gold');

    const nodeIds = result.nodes.map((node) => node.id);
    expect(nodeIds).toEqual(expect.arrayContaining(['gold-mart', 'taskflow-gold', 'adw-gold-sales']));

    const edgeIds = result.edges.map((edge) => edge.id);
    expect(edgeIds).toEqual(expect.arrayContaining(['gold-delivers-bi', 'taskflow-writes-gold']));
  });
});

describe('sample snapshot regression guard', () => {
  test('keeps the February snapshot structure stable', () => {
    const febSnapshot = sampleSnapshots['2024-02-01T00:00:00Z'];

    expect(febSnapshot.nodes).toHaveLength(13);
    expect(febSnapshot.edges).toHaveLength(12);

    const nodeNames = febSnapshot.nodes.reduce((map, node) => map.set(node.id, node.name), new Map());
    expect(nodeNames.get('gold-mart')).toBe('Opportunity Gold Mart');
    expect(nodeNames.get('powerbi')).toBe('Power BI');

    const edgeTypes = febSnapshot.edges.reduce((map, edge) => map.set(edge.id, edge.type), new Map());
    expect(edgeTypes.get('gold-delivers-bi')).toBe('DELIVERS_TO');
  });
});
