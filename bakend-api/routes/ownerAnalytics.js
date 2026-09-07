const express = require('express');
const { getAisleScoreboard } = require('../services/aisleAnalytics');
const { getInventory } = require('../services/inventoryService');

const router = express.Router();

// Rolling windows, today included. Keys are what the client sends as ?period=.
const PERIOD_DAYS = {
  today: 1,
  '7d': 7,
  '30d': 30,
};

// Keeps callers that omit ?period= working exactly as before.
const DEFAULT_PERIOD = '7d';

router.get('/aisle-stats', async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;

  const period = String(req.query.period || DEFAULT_PERIOD).toLowerCase();
  const days = PERIOD_DAYS[period];

  if (!days) {
    return res.status(400).json({
      error: `Invalid period "${period}". Use one of: ${Object.keys(PERIOD_DAYS).join(', ')}`
    });
  }

  try {
    const aisles = await getAisleScoreboard({ limit, days });
    res.json({ aisles, limit, period, days });
  } catch (err) {
    console.error('Error loading aisle scoreboard:', err);
    res.status(500).json({ error: 'Unable to load aisle scoreboard' });
  }
});

// Store inventory grouped by category for the owner "Track Your Stock" screen.
// Mounted under /api/owner, so it already runs behind authenticate +
// requireRole('store_owner'); no extra gating needed here.
router.get('/inventory', async (req, res) => {
  try {
    const inventory = await getInventory();
    res.json(inventory);
  } catch (err) {
    console.error('Error loading inventory:', err);
    res.status(500).json({ error: 'Unable to load store inventory' });
  }
});

module.exports = router;