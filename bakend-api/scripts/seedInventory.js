const admin = require('../firebase/firebaseAdmin');
const db = require('../firebase/firestoreService');
const {
  STORE_ID,
  DEFAULT_LOW_STOCK_THRESHOLD,
  productsCollection,
  getInventory,
} = require('../services/inventoryService');

// Seeds storeInventory/<STORE_ID>/products, the collection GET /api/owner/inventory
// reads for the owner "Track Your Stock" screen.
//
// The catalogue below is the demo store's 60 base products (the abc.csv rows
// without the " 1".." 4" load-test suffixes). Product name, brand, category and
// aisle come straight from that catalogue so the inventory view lines up with
// storeMaps/demoStore.productToAisleMap and categoryBrands.
//
// Quantities are seeded values chosen to make the low/out-of-stock alerts
// demonstrable: a handful of items are at 0 (out of stock) and several sit at or
// below DEFAULT_LOW_STOCK_THRESHOLD. batch.set is a full overwrite (no merge),
// so re-running resets the baseline instead of drifting.
const CATALOG = [
  // Herbs & spices
  { id: '3001', name: 'Zeera', brand: 'National', category: 'Herbs & spices', aisle: 'Aisle1', quantity: 6 },
  { id: '3002', name: 'Haldi', brand: 'Shan', category: 'Herbs & spices', aisle: 'Aisle1', quantity: 0 },
  { id: '3003', name: 'Laal Mirch', brand: 'Mehran', category: 'Herbs & spices', aisle: 'Aisle1', quantity: 42 },
  // Grains & pulses
  { id: '3004', name: 'Basmati Rice', brand: 'Guard', category: 'grains & pulses', aisle: 'Aisle2', quantity: 18 },
  { id: '3005', name: 'Masoor Dal', brand: 'Fauji', category: 'grains & pulses', aisle: 'Aisle2', quantity: 7 },
  { id: '3006', name: 'Chana Dal', brand: 'Sabroso', category: 'grains & pulses', aisle: 'Aisle2', quantity: 33 },
  // Breakfast
  { id: '3007', name: 'Cornflakes', brand: "Kellogg's", category: 'Breakfast', aisle: 'Aisle3', quantity: 25 },
  { id: '3008', name: 'Paratha', brand: 'Dawn', category: 'Breakfast', aisle: 'Aisle3', quantity: 4 },
  { id: '3009', name: 'Bread', brand: 'Bake Parlour', category: 'Breakfast', aisle: 'Aisle3', quantity: 2 },
  // Sugar & sweeteners
  { id: '3010', name: 'White Sugar', brand: 'Sufi', category: 'Sugar & sweeteners', aisle: 'Aisle4', quantity: 50 },
  { id: '3011', name: 'Brown Sugar', brand: 'Shakarganj', category: 'Sugar & sweeteners', aisle: 'Aisle4', quantity: 0 },
  { id: '3012', name: 'Honey', brand: 'Marhaba', category: 'Sugar & sweeteners', aisle: 'Aisle4', quantity: 14 },
  // Pasta & noodles
  { id: '3013', name: 'Macaroni', brand: 'Knorr', category: 'Pasta & noodles', aisle: 'Aisle5', quantity: 22 },
  { id: '3014', name: 'Spaghetti', brand: "Young's", category: 'Pasta & noodles', aisle: 'Aisle5', quantity: 9 },
  { id: '3015', name: 'Instant Noodles', brand: 'Maggi', category: 'Pasta & noodles', aisle: 'Aisle5', quantity: 61 },
  // Personal Care
  { id: '3016', name: 'Shampoo', brand: 'Sunsilk', category: 'Personal Care', aisle: 'Aisle6', quantity: 30 },
  { id: '3017', name: 'Toothpaste', brand: 'Colgate', category: 'Personal Care', aisle: 'Aisle6', quantity: 12 },
  { id: '3018', name: 'Soap', brand: 'Lux', category: 'Personal Care', aisle: 'Aisle6', quantity: 5 },
  // Household cleaning
  { id: '3019', name: 'Floor Cleaner', brand: 'Dettol', category: 'Household cleaning', aisle: 'Aisle7', quantity: 0 },
  { id: '3020', name: 'Toilet Cleaner', brand: 'Harpic', category: 'Household cleaning', aisle: 'Aisle7', quantity: 16 },
  { id: '3021', name: 'Dish Soap', brand: 'Max', category: 'Household cleaning', aisle: 'Aisle7', quantity: 8 },
  // Sauces & Chutneys
  { id: '3022', name: 'Tomato Ketchup', brand: "Mitchell's", category: 'Sauces & Chutneys', aisle: 'Aisle8', quantity: 19 },
  { id: '3023', name: 'Imli Chutney', brand: 'National', category: 'Sauces & Chutneys', aisle: 'Aisle8', quantity: 3 },
  { id: '3024', name: 'Green Chutney', brand: 'Shan', category: 'Sauces & Chutneys', aisle: 'Aisle8', quantity: 27 },
  // Oils & fats
  { id: '3025', name: 'Cooking Oil', brand: 'Dalda', category: 'oils & fats', aisle: 'Aisle9', quantity: 40 },
  { id: '3026', name: 'Ghee', brand: 'Habib', category: 'oils & fats', aisle: 'Aisle9', quantity: 11 },
  { id: '3027', name: 'Olive Oil', brand: 'Sufi', category: 'oils & fats', aisle: 'Aisle9', quantity: 6 },
  // Tea & Coffee
  { id: '3028', name: 'Tea Bags', brand: 'Lipton', category: 'Tea & Coffee', aisle: 'Aisle10', quantity: 55 },
  { id: '3029', name: 'Green Tea', brand: 'Tapal', category: 'Tea & Coffee', aisle: 'Aisle10', quantity: 10 },
  { id: '3030', name: 'Instant Coffee', brand: 'Nescafe', category: 'Tea & Coffee', aisle: 'Aisle10', quantity: 21 },
  // Snacks
  { id: '3031', name: 'Chips', brand: 'Lays', category: 'Snacks', aisle: 'Aisle11', quantity: 48 },
  { id: '3032', name: 'Nimco', brand: 'Kolson', category: 'Snacks', aisle: 'Aisle11', quantity: 13 },
  { id: '3033', name: 'Chocolate', brand: 'Candyland', category: 'Snacks', aisle: 'Aisle11', quantity: 2 },
  // Pet food
  { id: '3034', name: 'Dog Food', brand: 'Pedigree', category: 'Pet food', aisle: 'Aisle12', quantity: 17 },
  { id: '3035', name: 'Cat Food', brand: 'Whiskas', category: 'Pet food', aisle: 'Aisle12', quantity: 0 },
  { id: '3036', name: 'Bird Seeds', brand: 'Generic', category: 'Pet food', aisle: 'Aisle12', quantity: 9 },
  // Baby Care
  { id: '3037', name: 'Diapers', brand: 'Canbebe', category: 'Baby Care', aisle: 'Aisle13', quantity: 26 },
  { id: '3038', name: 'Baby Lotion', brand: "Johnson's", category: 'Baby Care', aisle: 'Aisle13', quantity: 7 },
  { id: '3039', name: 'Baby Shampoo', brand: 'Pampers', category: 'Baby Care', aisle: 'Aisle13', quantity: 15 },
  // Paper products
  { id: '3040', name: 'Toilet Paper', brand: 'Rose Petal', category: 'Paper products', aisle: 'Aisle14', quantity: 34 },
  { id: '3041', name: 'Tissue Box', brand: 'Premier', category: 'Paper products', aisle: 'Aisle14', quantity: 12 },
  { id: '3042', name: 'Paper Towels', brand: 'Fine', category: 'Paper products', aisle: 'Aisle14', quantity: 4 },
  // Fruits & Vegetables
  { id: '3043', name: 'Apple', brand: 'Local', category: 'Fruits & Vegetables', aisle: 'Aisle15', quantity: 60 },
  { id: '3044', name: 'Potato', brand: 'Local', category: 'Fruits & Vegetables', aisle: 'Aisle15', quantity: 22 },
  { id: '3045', name: 'Carrot', brand: 'Local', category: 'Fruits & Vegetables', aisle: 'Aisle15', quantity: 8 },
  // Bakery
  { id: '3046', name: 'Bun', brand: 'Bread & Beyond', category: 'Bakery', aisle: 'Aisle16', quantity: 3 },
  { id: '3047', name: 'Cake', brand: 'Layers', category: 'Bakery', aisle: 'Aisle16', quantity: 0 },
  { id: '3048', name: 'Croissant', brand: 'Delizia', category: 'Bakery', aisle: 'Aisle16', quantity: 11 },
  // Meat & poultry
  { id: '3049', name: 'Chicken', brand: "K&N's", category: 'Meat & poultry', aisle: 'Aisle17', quantity: 19 },
  { id: '3050', name: 'Mutton', brand: 'Local', category: 'Meat & poultry', aisle: 'Aisle17', quantity: 6 },
  { id: '3051', name: 'Beef', brand: 'Local', category: 'Meat & poultry', aisle: 'Aisle17', quantity: 14 },
  // Sea food
  { id: '3052', name: 'Shrimp', brand: 'Local', category: 'Sea food', aisle: 'Aisle18', quantity: 10 },
  { id: '3053', name: 'Rohu Fish', brand: 'Local', category: 'Sea food', aisle: 'Aisle18', quantity: 5 },
  { id: '3054', name: 'Crab', brand: 'Local', category: 'Sea food', aisle: 'Aisle18', quantity: 0 },
  // Frozen food
  { id: '3055', name: 'Frozen Paratha', brand: 'Dawn', category: 'Frozen food', aisle: 'Aisle19', quantity: 23 },
  { id: '3056', name: 'Frozen Nuggets', brand: "K&N's", category: 'Frozen food', aisle: 'Aisle19', quantity: 12 },
  { id: '3057', name: 'Frozen Fries', brand: 'McCain', category: 'Frozen food', aisle: 'Aisle19', quantity: 7 },
  // Beverages
  { id: '3058', name: 'Cola', brand: 'Pepsi', category: 'Beverages', aisle: 'Aisle20', quantity: 70 },
  { id: '3059', name: 'Juice', brand: 'Nestle Fruita Vitals', category: 'Beverages', aisle: 'Aisle20', quantity: 16 },
  { id: '3060', name: 'Energy Drink', brand: 'Sting', category: 'Beverages', aisle: 'Aisle20', quantity: 9 },
];

async function seedInventory() {
  const collection = productsCollection();
  // 60 writes fit well inside Firestore's 500-per-batch limit, so one commit.
  const batch = db.batch();

  for (const item of CATALOG) {
    batch.set(collection.doc(item.id), {
      name: item.name,
      brand: item.brand,
      category: item.category,
      aisle: item.aisle,
      quantity: item.quantity,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`✅ Seeded ${CATALOG.length} products into storeInventory/${STORE_ID}/products`);
}

// Reads back through the real service so we verify exactly what the API returns.
async function verify() {
  const inventory = await getInventory();
  const { summary } = inventory;

  if (summary.products === 0) {
    console.log('\n❌ No products read back - the owner screen would show an empty state');
    return;
  }

  console.log(`\nSummary: ${summary.categories} categories · ${summary.products} products · ${summary.lowStock} low · ${summary.outOfStock} out of stock`);

  const attention = inventory.categories.filter((c) => c.status !== 'ok');
  console.log(`Categories flagged: ${attention.map((c) => `${c.category} (${c.status})`).join(', ') || 'none'}`);

  const sample = inventory.categories[0];
  if (sample) {
    console.log(`\nTop category "${sample.category}":`);
    sample.products.forEach((p) => console.log(`   ${p.name} — ${p.quantity} units [${p.status}]`));
  }
}

async function main() {
  try {
    await seedInventory();
    await verify();
  } catch (error) {
    console.error('❌ Error seeding inventory:', error.message);
    console.log('💡 Make sure Firestore database is created in your Firebase project');
    process.exitCode = 1;
  }
}

main().then(() => process.exit(process.exitCode || 0));
