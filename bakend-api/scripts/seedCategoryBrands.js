/**
 * Upload category → unique brands mapping to Firestore
 *
 * Collection: categoryBrands
 * Document ID: <category name>
 * Fields: { brands: [ 'Brand1', 'Brand2', ... ] }
 */

const db = require('../firebase/firestoreService'); // adjust path if needed

// -----------------------
// Hard‑coded mapping
// -----------------------
const categoryBrands = {
  'Baby Care': ['Canbebe', "Johnson's", 'Pampers'],
  Bakery: ['Bread & Beyond', 'Delizia', 'Layers'],
  Beverages: ['Nestle Fruita Vitals', 'Pepsi', 'Sting'],
  Breakfast: ['Bake Parlour', 'Dawn', "Kellogg's"],
  'Frozen food': ['Dawn', "K&N's", 'McCain'],
  'Fruits & Vegetables': ['Local'],
  'Herbs & spices': ['Mehran', 'National', 'Shan'],
  'Household cleaning': ['Dettol', 'Harpic', 'Max'],
  'Meat & poultry': ["K&N's", 'Local'],
  'Paper products': ['Fine', 'Premier', 'Rose Petal'],
  'Pasta & noodles': ['Knorr', 'Maggi', "Young's"],
  'Personal Care': ['Colgate', 'Lux', 'Sunsilk'],
  'Pet food': ['Generic', 'Pedigree', 'Whiskas'],
  'Sauces & Chutneys': ["Mitchell's", 'National', 'Shan'],
  'Sea food': ['Local'],
  Snacks: ['Candyland', 'Kolson', 'Lays'],
  'Sugar & sweeteners': ['Marhaba', 'Shakarganj', 'Sufi'],
  'Tea & Coffee': ['Lipton', 'Nescafe', 'Tapal'],
  'Grains & pulses': ['Fauji', 'Guard', 'Sabroso'],
  'Oils & fats': ['Dalda', 'Habib', 'Sufi'],
};

async function seedCategoryBrands() {
  try {
    const batch = db.batch();
    const collectionRef = db.collection('categoryBrands');

    Object.entries(categoryBrands).forEach(([category, brands]) => {
      // Firestore doc IDs can contain spaces; change here if you prefer another scheme
      const docRef = collectionRef.doc(category);
      batch.set(docRef, { brands }, { merge: true });
    });

    await batch.commit();
    console.log('✅ Successfully uploaded category‑brand mapping to Firestore');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error uploading to Firestore:', err.message);
    process.exit(1);
  }
}

seedCategoryBrands();
