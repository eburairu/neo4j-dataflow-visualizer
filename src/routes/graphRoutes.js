const express = require('express');
const { getGraph, getFullGraph, getDiff, listSnapshots, searchEntities } = require('../services/graphService');

const router = express.Router();

router.get('/graph', async (req, res) => {
  const { rootId, depth = 10, direction = 'both', snapshot } = req.query;
  if (!rootId) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'rootId is required' });
  }

  try {
    const graph = await getGraph({ rootId, depth: Number(depth), direction, snapshot });
    res.json(graph);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch graph', details: error.message });
  }
});

router.get('/graph/all', async (req, res) => {
  const { snapshot } = req.query;

  try {
    const graph = await getFullGraph(snapshot);
    res.json(graph);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch full graph', details: error.message });
  }
});

router.get('/diff', async (req, res) => {
  const { base, target, includeEdges } = req.query;
  if (!base || !target) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'base and target snapshots are required' });
  }

  const parseBoolean = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    if (typeof value === 'boolean') return value;
    const lowered = value.toString().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) return true;
    if (['false', '0', 'no', 'n'].includes(lowered)) return false;
    return null;
  };

  const includeEdgesFlag = parseBoolean(includeEdges, true);
  if (includeEdgesFlag === null) {
    return res.status(400).json({
      code: 'BAD_REQUEST',
      message: 'includeEdges must be a boolean-like value (true/false)',
    });
  }

  try {
    const diff = await getDiff({ baseSnapshot: base, targetSnapshot: target, includeEdges: includeEdgesFlag });
    res.json({ nodes: diff.nodes, edges: diff.edges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to compute diff', details: error.message });
  }
});

router.get('/snapshots', (_req, res) => {
  res.json({ snapshots: listSnapshots() });
});

router.get('/search', async (req, res) => {
  const { term, snapshot } = req.query;
  if (!term || !term.trim()) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'term is required' });
  }

  try {
    const results = await searchEntities({ term, snapshot });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to search graph', details: error.message });
  }
});

module.exports = router;
