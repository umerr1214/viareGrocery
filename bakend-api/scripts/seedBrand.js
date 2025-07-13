const db = require('../firebase/firestoreService');

const brands = [
  'Bake Parlour', 'Bread & Beyond', 'Canbebe', 'Candyland', 'Colgate', 'Dalda', 'Dawn',
  'Delizia', 'Dettol', 'Fauji', 'Fine', 'Generic', 'Guard', 'Habib', 'Harpic',
  "Johnson's", "K&N's", "Kellogg's", 'Knorr', 'Kolson', 'Layers', 'Lays', 'Lipton',
  'Local', 'Lux', 'Maggi', 'Marhaba', 'Max', 'McCain', 'Mehran', "Mitchell's",
  'National', 'Nescafe', 'Nestle Fruita Vitals', 'Pampers', 'Pedigree', 'Pepsi',
  'Premier', 'Rose Petal', 'Sabroso', 'Shakarganj', 'Shan', 'Sting', 'Sufi', 'Sunsilk',
  'Tapal', 'Whiskas', "Young's"
];

async function seedBrands() {
  try {
    const ref = db.collection('storeMaps').doc('brandList');
    await ref.set({ brands }, { merge: true });
    console.log('✅ Successfully uploaded brand list to Firestore');
  } catch (error) {
    console.error('❌ Error uploading brands:', error.message);
  }
}

seedBrands().then(() => process.exit()).catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
