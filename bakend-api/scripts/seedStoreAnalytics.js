const admin = require('../firebase/firebaseAdmin');
const db = require('../firebase/firestoreService');
const {
  STORE_ID,
  aisleId,
  recentDayKeys,
  getAisleScoreboard,
} = require('../services/aisleAnalytics');

// Seeds storeAnalytics/<STORE_ID>/aisles, the subcollection that
// GET /api/owner/aisle-stats reads for the Seller Insights dashboard.
//
// Aisle names MUST match the values in storeMaps/demoStore.productToAisleMap and
// the nodes in data/storeGraph.json (Aisle1..Aisle20). recordAisleVisits hashes
// the aisle name to build the document id, so a name outside that vocabulary
// would never be incremented by a real customer route and would sit as a
// permanent orphan row.
//
// Each doc gets a dailyVisits map keyed by the same UTC day keys the live write
// path uses (recentDayKeys), so real routes increment these buckets instead of
// starting parallel ones. "visits" is the all-time total and is written as a
// plain number, not FieldValue.increment, so re-running resets the baseline.
const SEED_DAYS = 30;

// Day keys come from the service, index 0 = today, so the weekday maths below
// can never disagree with the buckets the API aggregates over.
const weekdayOf = (dayKey) => new Date(`${dayKey}T00:00:00Z`).getUTCDay();
const isWeekend = (dayKey) => [0, 6].includes(weekdayOf(dayKey));

// The shapes are deliberately different so Today / 7 days / 30 days rank
// different aisles first - that is what makes the period tabs demonstrable.
// Note the numbers are date-driven: run this on a Saturday and the weekend
// spike lands on "today" instead. The pattern still holds, the leaders shift.
const seedAisles = [
  {
    aisle: 'Aisle10', // Tea Bags, Instant Coffee, Milk
    note: 'leads TODAY - tasting promo running now, low baseline otherwise',
    perDay: (daysAgo) => (daysAgo === 0 ? 18 : daysAgo < 7 ? 5 : 4),
  },
  {
    aisle: 'Aisle11', // Chips, Nimco, Chocolate
    note: 'leads 7 DAYS - weekend snacking spikes, quiet on weekdays',
    perDay: (daysAgo, dayKey) => (isWeekend(dayKey) ? 22 : 4),
  },
  {
    aisle: 'Aisle9', // Cooking Oil, Ghee, Butter
    note: 'leads 30 DAYS - heavy bulk buying weeks ago that has since faded',
    perDay: (daysAgo) => Math.round(2 + daysAgo * 0.55),
  },
  {
    aisle: 'Aisle15', // Apple, Potato, Carrot
    note: 'everyday staple on a three-day replenishment cycle',
    perDay: (daysAgo) => 5 + (daysAgo % 3 === 0 ? 2 : 0),
  },
  {
    aisle: 'Aisle16', // Bun, Cake, Croissant
    note: 'mid-week bakery peak, flat at the weekend',
    perDay: (daysAgo, dayKey) => ([2, 3, 4].includes(weekdayOf(dayKey)) ? 9 : 2),
  },
  {
    aisle: 'Aisle3', // Cornflakes, Bread, Eggs, Yogurt
    note: 'breakfast aisle with a mild weekend uplift',
    perDay: (daysAgo, dayKey) => (isWeekend(dayKey) ? 7 : 4),
  },
];

// The store document is only a parent for the "aisles" subcollection. If it also
// carries per-aisle fields, the dashboard still reads nothing, because the query
// targets the subcollection. Clear those fields but keep the document itself:
// it is the natural home for future per-store metadata (name, ownerId) once
// more than one shop is onboarded.
async function clearMisplacedParentFields() {
  const parentRef = db.collection('storeAnalytics').doc(STORE_ID);
  const snapshot = await parentRef.get();

  if (!snapshot.exists) {
    console.log(`ℹ️  storeAnalytics/${STORE_ID} does not exist yet; the subcollection will create it`);
    return;
  }

  const staleKeys = Object.keys(snapshot.data());
  if (staleKeys.length === 0) {
    console.log(`ℹ️  storeAnalytics/${STORE_ID} already has no misplaced fields`);
    return;
  }

  const updates = {};
  for (const key of staleKeys) {
    updates[key] = admin.firestore.FieldValue.delete();
  }
  await parentRef.update(updates);

  console.log(`🧹 Cleared misplaced fields on storeAnalytics/${STORE_ID}: ${staleKeys.join(', ')}`);
}

async function seedAisleVisits() {
  const collection = db.collection('storeAnalytics').doc(STORE_ID).collection('aisles');
  const batch = db.batch();
  const dayKeys = recentDayKeys(SEED_DAYS);

  for (const { aisle, perDay } of seedAisles) {
    const dailyVisits = {};
    dayKeys.forEach((dayKey, daysAgo) => {
      const count = perDay(daysAgo, dayKey);
      if (count > 0) dailyVisits[dayKey] = count;
    });

    const allTime = Object.values(dailyVisits).reduce((total, count) => total + count, 0);
    const mostRecentDay = dayKeys.find((dayKey) => dailyVisits[dayKey] > 0);

    // Deliberately NOT merge:true - a full overwrite drops day keys left behind
    // by an earlier run on a different date, so the baseline really does reset.
    batch.set(collection.doc(aisleId(aisle)), {
      aisle,
      visits: allTime,
      dailyVisits,
      lastVisitedAt: admin.firestore.Timestamp.fromDate(new Date(`${mostRecentDay}T18:30:00Z`)),
    });
  }

  await batch.commit();
  console.log(`✅ Seeded ${seedAisles.length} aisles × ${SEED_DAYS} days into storeAnalytics/${STORE_ID}/aisles`);
}

// Reads back through the real service, once per period the dashboard offers.
async function verify() {
  const windows = [['Today', 1], ['7 days', 7], ['30 days', 30]];

  for (const [label, days] of windows) {
    const board = await getAisleScoreboard({ limit: 100, days });

    if (board.length === 0) {
      console.log(`\n❌ ${label}: no rows - dashboard would show "No aisle activity yet"`);
      continue;
    }

    const ranked = board
      .filter((row) => row.visits > 0)
      .slice(0, 6)
      .map((row) => `${row.aisle} ${row.visits}`)
      .join('  ·  ');

    console.log(`\n${label} (days=${days}) — hot aisle: ${board[0].aisle} (${board[0].visits} visits)`);
    console.log(`   ${ranked}`);
  }

  const byWindow = await Promise.all(windows.map(([, days]) => getAisleScoreboard({ limit: 1, days })));
  const leaders = byWindow.map((board) => board[0]?.aisle);
  if (new Set(leaders).size > 1) {
    console.log(`\n✅ Period tabs differ — leaders: ${leaders.join(' / ')}`);
  } else {
    console.log(`\n⚠️  All three periods returned the same leader (${leaders[0]}); the tabs will look identical`);
  }
}

async function seed() {
  try {
    await clearMisplacedParentFields();
    await seedAisleVisits();
    await verify();
  } catch (error) {
    console.error('❌ Error seeding store analytics:', error.message);
    console.log('💡 Make sure Firestore database is created in your Firebase project');
    console.log('💡 Visit: https://console.firebase.google.com/project/viaregrocery/firestore');
    process.exitCode = 1;
  }
}

seed().then(() => process.exit(process.exitCode || 0));
