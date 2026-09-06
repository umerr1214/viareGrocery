const express = require('express');
const { getAisleScoreboard } = require('../services/aisleAnalytics');

const router = express.Router();

router.get('/aisle-stats', async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;

  try {
    const aisles = await getAisleScoreboard(limit);
    res.json({ aisles, limit });
  } catch (err) {
    console.error('Error loading aisle scoreboard:', err);
    res.status(500).json({ error: 'Unable to load aisle scoreboard' });
  }
});

module.exports = router;