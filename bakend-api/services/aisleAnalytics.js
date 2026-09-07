const crypto = require('crypto');
const admin = require('../firebase/firebaseAdmin');
const db = require('../firebase/firestoreService');

const STORE_ID = 'demoStore';

const aisleId = (aisle) => crypto
  .createHash('sha1')
  .update(aisle)
  .digest('hex');

const aisleCollection = () => db
  .collection('storeAnalytics')
  .doc(STORE_ID)
  .collection('aisles');

const DAY_MS = 24 * 60 * 60 * 1000;

// Day boundaries are UTC. The store's local timezone is not modelled yet; if it
// ever is, this is the single place to change, because both the write path and
// the aggregation build their keys through it. Keeping them in step matters: a
// write path on local time and a reader on UTC would silently misfile visits.
const dayKey = (date) => date.toISOString().slice(0, 10);

// Most recent day first, so `days: 1` is exactly today's bucket.
const recentDayKeys = (days) => {
  const now = Date.now();
  return Array.from({ length: days }, (_, offset) => dayKey(new Date(now - offset * DAY_MS)));
};

const sumVisits = (dailyVisits, keys) => keys.reduce(
  (total, key) => total + (Number(dailyVisits?.[key]) || 0),
  0
);

const recordAisleVisits = async (aisles) => {
  const uniqueAisles = [...new Set(
    aisles
      .filter((aisle) => typeof aisle === 'string' && aisle.trim())
      .map((aisle) => aisle.trim())
  )];

  if (uniqueAisles.length === 0) return;

  const batch = db.batch();
  const collection = aisleCollection();
  const today = dayKey(new Date());

  for (const name of uniqueAisles) {
    const ref = collection.doc(aisleId(name));
    batch.set(ref, {
      aisle: name,
      // All-time total, kept as a cheap counter so it never has to be re-summed.
      visits: admin.firestore.FieldValue.increment(1),
      // Per-day bucket backing the Today / 7 days / 30 days views. merge:true
      // deep-merges the map and increment() creates the key on first write, so a
      // new day just starts a new key - no rollover job, no extra reads.
      dailyVisits: { [today]: admin.firestore.FieldValue.increment(1) },
      lastVisitedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
};

/**
 * Aisles ranked by visits inside a rolling window.
 * @param {object} [options]
 * @param {number} [options.limit=20] - max rows to return
 * @param {number} [options.days=30]  - window size in days, today included
 */
const getAisleScoreboard = async ({ limit = 20, days = 30 } = {}) => {
  const windowKeys = recentDayKeys(days);

  // The ranking key is a computed sum, which Firestore cannot orderBy, so the
  // subcollection is read whole and aggregated here. It holds one doc per aisle
  // (~20 for the demo store), so this stays cheap.
  const snapshot = await aisleCollection().get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        code: doc.id,
        aisle: data.aisle,
        visits: sumVisits(data.dailyVisits, windowKeys),
        totalVisits: data.visits || 0,
        lastVisitedAt: data.lastVisitedAt?.toDate?.()?.toISOString() || null,
      };
    })
    .sort((a, b) => b.visits - a.visits
      || b.totalVisits - a.totalVisits
      || String(a.aisle).localeCompare(String(b.aisle)))
    .slice(0, limit);
};

module.exports = {
  getAisleScoreboard,
  recordAisleVisits,
  // Exported so seeding/maintenance scripts address exactly the same documents
  // and day buckets the live write path uses. Duplicating STORE_ID, the hashing
  // scheme or the date format in a script would create rows that never merge
  // with real traffic.
  STORE_ID,
  aisleId,
  dayKey,
  recentDayKeys,
};