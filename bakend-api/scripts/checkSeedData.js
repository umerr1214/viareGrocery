const db = require('../firebase/firestoreService');

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

async function main() {
  console.log('Checking Firestore seed data...\n');

  await checkDoc('storeMaps', 'demoStore', 'productToAisleMap');
  await checkDoc('storeMaps', 'categoryList', 'categories');
  await checkDoc('storeMaps', 'brandList', 'brands');
  await checkCategoryBrands();

  console.log('\nDone.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
  });
