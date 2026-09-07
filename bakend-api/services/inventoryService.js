const db = require('../firebase/firestoreService');

// Same demo-store identifier the aisle analytics service uses. Exported so the
// seed/maintenance scripts address exactly the same documents the read path
// queries - duplicating it in a script would create rows the API never sees
// (the same trap documented for services/aisleAnalytics.js).
const STORE_ID = 'demoStore';

// A product holding at or below this many units is "low"; zero is "out". Each
// product doc stores its own lowStockThreshold so it can be tuned per item
// later; this is only the seeded default and the fallback for legacy docs.
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

// storeInventory/<STORE_ID>/products - one doc per product, keyed by product id.
// One collection read (~60 docs for the demo store) backs the whole owner stock
// screen, and a single product can be updated by id without touching the rest.
const productsCollection = () => db
  .collection('storeInventory')
  .doc(STORE_ID)
  .collection('products');

// Ordering key so "attention" rows/categories float to the top of the UI.
const STATUS_RANK = { out: 0, low: 1, ok: 2 };

const statusFor = (quantity, threshold) => {
  if (quantity <= 0) return 'out';
  if (quantity <= threshold) return 'low';
  return 'ok';
};

/**
 * Reads the demo store's products and groups them by category, computing a
 * stock status per product and a roll-up per category. The category layer needs
 * the worst status inside it (out > low > ok) so the owner sees at a glance
 * which categories need replenishment before drilling in.
 *
 * The grouping is done here rather than in Firestore because "worst status per
 * category" is a computed roll-up the query API cannot orderBy; the collection
 * is small enough to aggregate in memory on every request.
 */
const getInventory = async () => {
  const snapshot = await productsCollection().get();

  const byCategory = new Map();
  let lowStock = 0;
  let outOfStock = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const quantity = Number(data.quantity) || 0;
    const threshold = Number(data.lowStockThreshold) || DEFAULT_LOW_STOCK_THRESHOLD;
    const status = statusFor(quantity, threshold);

    if (status === 'low') lowStock += 1;
    if (status === 'out') outOfStock += 1;

    const category = data.category || 'Uncategorised';
    if (!byCategory.has(category)) {
      byCategory.set(category, {
        category,
        productCount: 0,
        lowCount: 0,
        outCount: 0,
        products: [],
      });
    }

    const bucket = byCategory.get(category);
    bucket.productCount += 1;
    if (status === 'low') bucket.lowCount += 1;
    if (status === 'out') bucket.outCount += 1;
    bucket.products.push({
      id: doc.id,
      name: data.name || doc.id,
      brand: data.brand || '',
      aisle: data.aisle || '',
      quantity,
      lowStockThreshold: threshold,
      status,
    });
  });

  const categories = [...byCategory.values()].map((bucket) => {
    const status = bucket.outCount > 0 ? 'out' : bucket.lowCount > 0 ? 'low' : 'ok';
    // Attention items first, then alphabetical, so the reason a category is
    // flagged is the first thing the owner sees when they expand it.
    bucket.products.sort((a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status]
      || String(a.name).localeCompare(String(b.name)));
    return { ...bucket, status };
  });

  // Categories needing attention float to the top, then alphabetical.
  categories.sort((a, b) =>
    STATUS_RANK[a.status] - STATUS_RANK[b.status]
    || String(a.category).localeCompare(String(b.category)));

  return {
    storeId: STORE_ID,
    summary: {
      categories: categories.length,
      products: snapshot.size,
      lowStock,
      outOfStock,
    },
    categories,
  };
};

module.exports = {
  getInventory,
  // Exported so seeding/maintenance scripts write to exactly the documents this
  // read path queries.
  STORE_ID,
  DEFAULT_LOW_STOCK_THRESHOLD,
  productsCollection,
};
