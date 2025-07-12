const express = require('express');
const router = express.Router();
const { findShortestPath } = require('../utils/dijkstra');
const aisleMap = require('../data/productToAisleMap.json');
const storeGraph = require('../data/storeGraph.json');

router.post('/', (req, res) => {
  const { products } = req.body;

  // 1. Map products to aisle nodes
  const aisles = products
    .map(p => aisleMap[p.toLowerCase()])
    .filter(Boolean);

  const path = findShortestPath(storeGraph, 'Entrance', aisles, 'Counter');

  const instructions = path.map((node, idx) => {
    if (idx === 0) return 'Start at Entrance';
    if (idx === path.length - 1) return 'Proceed to Counter';
    const product = Object.entries(aisleMap).find(([k, v]) => v === node);
    return `Go to ${node} – Pick ${product?.[0] || 'item'}`;
  });

  res.json({ path, instructions });
});

module.exports = router;
