const express = require('express');
const { getGraph, getDiff, listSnapshots } = require('../services/graphService');

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

router.get('/diff', async (req, res) => {
  const { base, target } = req.query;
  if (!base || !target) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'base and target snapshots are required' });
  }

  try {
    const diff = await getDiff(base, target);
    res.json(diff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to compute diff', details: error.message });
  }
});

router.get('/snapshots', (_req, res) => {
  res.json({ snapshots: listSnapshots() });
});

module.exports = router;
