const express = require('express');
const request = require('supertest');

jest.mock('../src/neo4j/driver', () => ({
  getSession: jest.fn(() => null),
}));

const graphRoutes = require('../src/routes/graphRoutes');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', graphRoutes);
  return app;
};

describe('GET /api/diff', () => {
  test('returns unified node and edge diff structure from sample data', async () => {
    const app = buildApp();

    const res = await request(app)
      .get('/api/diff')
      .query({ base: '2024-01-01T00:00:00Z', target: '2024-02-01T00:00:00Z' });

    expect(res.status).toBe(200);
    expect(res.body.nodes.added.map((node) => node.id).sort()).toEqual(
      ['gold-mart', 'powerbi', 'taskflow-gold'].sort()
    );
    expect(res.body.nodes.removed).toHaveLength(0);
    expect(res.body.edges.added.map((edge) => edge.id).sort()).toEqual(
      ['gold-delivers-bi', 'taskflow-reads-marketing', 'taskflow-reads-silver', 'taskflow-writes-gold'].sort()
    );
    expect(res.body.edges.removed).toHaveLength(0);
  });

  test('respects includeEdges flag to omit edge calculations', async () => {
    const app = buildApp();

    const res = await request(app)
      .get('/api/diff')
      .query({
        base: '2024-01-01T00:00:00Z',
        target: '2024-02-01T00:00:00Z',
        includeEdges: 'false',
      });

    expect(res.status).toBe(200);
    expect(res.body.nodes.added.length).toBeGreaterThan(0);
    expect(res.body.edges).toEqual({ added: [], removed: [] });
  });
});
