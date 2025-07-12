const express = require('express');
const router = express.Router();
const db = require('../firebase/firestoreService');
const { findShortestPath } = require('../utils/dijkstra');
const storeGraph = require('../data/storeGraph.json');

router.post('/', async (req, res) => {
  const { products } = req.body;
  console.log('Received products:', products);

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Products array is required and cannot be empty' });
  }

  try {
    const storeRef = db.collection('storeMaps').doc('demoStore');
    const doc = await storeRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Store map not found' });
    }

    const aisleMap = doc.data().productToAisleMap;
    console.log('Aisle map:', aisleMap);

    const aisles = products
      .map(p => aisleMap[p.trim()])
      .filter(Boolean);
    
    console.log('Mapped aisles:', aisles);
    
    if (aisles.length === 0) {
      return res.status(400).json({ error: 'No valid products found in the list' });
    }

    console.log('Store graph:', storeGraph);
    console.log('Starting pathfinding with:', { start: 'Entrance', stops: aisles, end: 'Counter' });

    const path = findShortestPath(storeGraph, 'Entrance', aisles, 'Counter');
    console.log('Calculated path:', path);

    if (!path || path.length === 0) {
      return res.status(404).json({ error: 'No path found to the requested aisles' });
    }

    const instructions = path.map((node, idx) => {
      if (idx === 0) return 'Start at Entrance';
      if (idx === path.length - 1) return 'Proceed to Counter';

      // Find which products from the user's request are in this aisle
      const productsInThisAisle = products.filter(product => aisleMap[product.trim()] === node);
      
      if (productsInThisAisle.length > 0) {
        return `Go to ${node} – Pick ${productsInThisAisle.join(', ')}`;
      } else {
        return `Cross ${node}`;
      }
    });

    console.log('Instructions:', instructions);
    res.json({ path, instructions });
  } catch (err) {
    console.error('Error in pathOptimizer:', err);
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

module.exports = router;
