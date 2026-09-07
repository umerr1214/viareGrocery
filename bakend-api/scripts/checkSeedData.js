const db = require('../firebase/firestoreService');
const { STORE_ID, getAisleScoreboard } = require('../services/aisleAnalytics');

async function checkDoc(collection, docId, expectedField) {
  const ref = db.collection(collection).doc(docId);
  const snap = await ref.get();

  if (!snap.exists) {
    console.log(`❌ ${collection}/${docId} — MISSING`);
    return;
  }

  const data = snap.data();
  const value = data[expectedField];
  const count = Array.isArray(value)
    ? value.length
    : value && typeof value === 'object'
    ? Object.keys(value).length
    : undefined;

  console.log(`✅ ${collection}/${docId} — field "${expectedField}" present, ${count ?? '?'} entries`);
}

async function checkCategoryBrands() {
  const snapshot = await db.collection('categoryBrands').get();

  if (snapshot.empty) {
    console.log('❌ categoryBrands — MISSING (no documents)');
    return;
  }

  let totalBrands = 0;
  let emptyDocs = [];
  snapshot.forEach((doc) => {
    const brands = doc.data().brands;
    if (!Array.isArray(brands) || brands.length === 0) {
      emptyDocs.push(doc.id);
    } else {
      totalBrands += brands.length;
    }
  });

  console.log(`✅ categoryBrands — ${snapshot.size} category docs, ${totalBrands} brand entries total`);
  if (emptyDocs.length > 0) {
    console.log(`   ⚠️  categories with no brands: ${emptyDocs.join(', ')}`);
  }
}

async function checkStoreAnalytics() {
  // The store document is only the parent of the "aisles" subcollection. Per-aisle
  // fields stored directly on it are read by no endpoint, so flag them: that shape
  // makes the dashboard show "No aisle activity yet" even though data exists.
  const parent = await db.collection('storeAnalytics').doc(STORE_ID).get();
  if (parent.exists) {
    const stray = Object.keys(parent.data());
    if (stray.length > 0) {
      console.log(`   ⚠️  storeAnalytics/${STORE_ID} carries ignored fields (${stray.join(', ')}) — aisle data belongs in the "aisles" subcollection`);
    }
  }

  const board = await getAisleScoreboard({ limit: 100, days: 30 });
  if (board.length === 0) {
    console.log(`❌ storeAnalytics/${STORE_ID}/aisles — MISSING (no documents), GET /api/owner/aisle-stats returns an empty scoreboard`);
    console.log('   💡 Run: node scripts/seedStoreAnalytics.js  (or generate a route via POST /api/path)');
    return;
  }

  const totalVisits = board.reduce((sum, row) => sum + row.visits, 0);
  const withoutDaily = board.filter((row) => row.visits === 0 && row.totalVisits > 0);
  console.log(`✅ storeAnalytics/${STORE_ID}/aisles — ${board.length} aisle docs, ${totalVisits} visits in the last 30 days, hottest: ${board[0].aisle} (${board[0].visits})`);
  if (withoutDaily.length > 0) {
    console.log(`   ⚠️  ${withoutDaily.length} doc(s) have an all-time total but no dailyVisits buckets, so every period shows 0: ${withoutDaily.map((row) => row.aisle).join(', ')}`);
  }
}

async function main() {
  console.log('Checking Firestore seed data...\n');

  await checkDoc('storeMaps', 'demoStore', 'productToAisleMap');
  await checkDoc('storeMaps', 'categoryList', 'categories');
  await checkDoc('storeMaps', 'brandList', 'brands');
  await checkCategoryBrands();
  await checkStoreAnalytics();

  console.log('\nDone.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
  });
