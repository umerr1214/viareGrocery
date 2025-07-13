const db = require('../firebase/firestoreService');

const categories = [
  'Baby Care', 'Bakery', 'Beverages', 'Breakfast', 'Frozen food', 'Fruits & Vegetables',
  'Herbs & spices', 'Household cleaning', 'Meat & poultry', 'Paper products',
  'Pasta & noodles', 'Personal Care', 'Pet food', 'Sauces & Chutneys', 'Sea food',
  'Snacks', 'Sugar & sweeteners', 'Tea & Coffee', 'grains & pulses', 'oils & fats'
];

async function seedCategories() {
  try {
    const ref = db.collection('storeMaps').doc('categoryList');
    await ref.set({ categories }, { merge: true });
    console.log('✅ Successfully uploaded category list to Firestore');
  } catch (error) {
    console.error('❌ Error uploading categories:', error.message);
  }
}

seedCategories().then(() => process.exit()).catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
