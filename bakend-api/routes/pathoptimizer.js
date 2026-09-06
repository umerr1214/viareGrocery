const express = require('express');
const router = express.Router();
const db = require('../firebase/firestoreService');
const { findShortestPath } = require('../utils/dijkstra');
const { recordAisleVisits } = require('../services/aisleAnalytics');
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

    const aisleMap = doc.data().productToAisleMap || {};
    console.log('Aisle map:', aisleMap);

    // Build a case-insensitive, trimmed lookup: normalized product name -> aisle
    const normalizedAisleMap = {};
    for (const [product, aisle] of Object.entries(aisleMap)) {
      normalizedAisleMap[product.trim().toLowerCase()] = aisle;
    }

    // Match each requested product, remembering the ones we could not find
    const matched = [];   // { product: nameAsTyped, aisle }
    const notFound = [];  // nameAsTyped
    for (const product of products) {
      const name = (typeof product === 'string' ? product : String(product ?? '')).trim();
      const aisle = normalizedAisleMap[name.toLowerCase()];
      if (aisle) {
        matched.push({ product: name, aisle });
      } else {
        notFound.push(name);
      }
    }

    // De-duplicate aisles while preserving first-seen order
    const aisles = [...new Set(matched.map(m => m.aisle))];

    console.log('Matched products:', matched);
    console.log('Products not found:', notFound);
    console.log('Mapped aisles (deduped):', aisles);

    if (aisles.length === 0) {
      return res.status(400).json({ error: 'No valid products found in the list', notFound });
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

      // Products the user asked for that live in this aisle (names preserved as typed)
      const productsInThisAisle = matched.filter(m => m.aisle === node).map(m => m.product);

      if (productsInThisAisle.length > 0) {
        return `Go to ${node} – Pick ${productsInThisAisle.join(', ')}`;
      } else {
        return `Cross ${node}`;
      }
    });

    console.log('Instructions:', instructions);

    // Count each aisle once per successfully generated customer route.
    // Analytics failures should not make an otherwise valid customer route fail.
    try {
      await recordAisleVisits(aisles);
    } catch (analyticsError) {
      console.error('Error recording aisle visits:', analyticsError);
    }

    res.json({ path, instructions, notFound });
  } catch (err) {
    console.error('Error in pathOptimizer:', err);
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

module.exports = router;
