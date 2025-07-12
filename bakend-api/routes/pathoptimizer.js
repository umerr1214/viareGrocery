const db = require('../firebase/firestoreService');

router.post('/', async (req, res) => {
  const { products } = req.body;

  try {
    const storeRef = db.collection('storeMaps').doc('demoStore');
    const doc = await storeRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Store map not found' });
    }

    const aisleMap = doc.data().productToAisleMap;

    const aisles = products
      .map(p => aisleMap[p.trim()])
      .filter(Boolean);

    const path = findShortestPath(storeGraph, 'Entrance', aisles, 'Counter');

    const instructions = path.map((node, idx) => {
      if (idx === 0) return 'Start at Entrance';
      if (idx === path.length - 1) return 'Proceed to Counter';

      const matchedProduct = Object.entries(aisleMap).find(([k, v]) => v === node);
      return `Go to ${node} – Pick ${matchedProduct?.[0] || 'item'}`;
    });

    res.json({ path, instructions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});
