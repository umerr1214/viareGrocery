const db = require('../firebase/firestoreService');

const productMap = {
  "Zeera": "Aisle1",
  "Haldi": "Aisle1",
  "Laal Mirch": "Aisle1",
  "Basmati Rice": "Aisle2",
  "Masoor Dal": "Aisle2",
  "Chana Dal": "Aisle2",
  "Cornflakes": "Aisle3",
  "Paratha": "Aisle3",
  "Bread": "Aisle3",
  "Eggs": "Aisle3",
  "Yogurt": "Aisle3",
  "White Sugar": "Aisle4",
  "Brown Sugar": "Aisle4",
  "Honey": "Aisle4",
  "Macaroni": "Aisle5",
  "Spaghetti": "Aisle5",
  "Instant Noodles": "Aisle5",
  "Shampoo": "Aisle6",
  "Toothpaste": "Aisle6",
  "Soap": "Aisle6",
  "Floor Cleaner": "Aisle7",
  "Toilet Cleaner": "Aisle7",
  "Dish Soap": "Aisle7",
  "Tomato Ketchup": "Aisle8",
  "Imli Chutney": "Aisle8",
  "Green Chutney": "Aisle8",
  "Cheese": "Aisle8",
  "Cooking Oil": "Aisle9",
  "Ghee": "Aisle9",
  "Olive Oil": "Aisle9",
  "Butter": "Aisle9",
  "Tea Bags": "Aisle10",
  "Green Tea": "Aisle10",
  "Instant Coffee": "Aisle10",
  "Milk": "Aisle10",
  "Chips": "Aisle11",
  "Nimco": "Aisle11",
  "Chocolate": "Aisle11",
  "Dog Food": "Aisle12",
  "Cat Food": "Aisle12",
  "Bird Seeds": "Aisle12",
  "Diapers": "Aisle13",
  "Baby Lotion": "Aisle13",
  "Baby Shampoo": "Aisle13",
  "Toilet Paper": "Aisle14",
  "Tissue Box": "Aisle14",
  "Paper Towels": "Aisle14",
  "Apple": "Aisle15",
  "Potato": "Aisle15",
  "Carrot": "Aisle15",
  "Bun": "Aisle16",
  "Cake": "Aisle16",
  "Croissant": "Aisle16",
  "Chicken": "Aisle17",
  "Mutton": "Aisle17",
  "Beef": "Aisle17",
  "Shrimp": "Aisle18",
  "Rohu Fish": "Aisle18",
  "Crab": "Aisle18",
  "Frozen Paratha": "Aisle19",
  "Frozen Nuggets": "Aisle19",
  "Frozen Fries": "Aisle19",
  "Cola": "Aisle20",
  "Juice": "Aisle20",
  "Energy Drink": "Aisle20"
};

async function seed() {
  try {
    const ref = db.collection('storeMaps').doc('demoStore');
    await ref.set({ productToAisleMap: productMap }, { merge: true });
    console.log('✅ Seeded expanded map to Firestore');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.log('💡 Make sure Firestore database is created in your Firebase project');
    console.log('💡 Visit: https://console.firebase.google.com/project/viaregrocery/firestore');
  }
}

seed().then(() => process.exit()).catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});