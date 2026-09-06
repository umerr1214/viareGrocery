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

const recordAisleVisits = async (aisles) => {
  const uniqueAisles = [...new Set(
    aisles
      .filter((aisle) => typeof aisle === 'string' && aisle.trim())
      .map((aisle) => aisle.trim())
  )];

  if (uniqueAisles.length === 0) return;

  const batch = db.batch();
  const collection = aisleCollection();

  for (const name of uniqueAisles) {
    const ref = collection.doc(aisleId(name));
    batch.set(ref, {
      aisle: name,
      visits: admin.firestore.FieldValue.increment(1),
      lastVisitedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
};

const getAisleScoreboard = async (limit = 20) => {
  const snapshot = await aisleCollection()
    .orderBy('visits', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    code: doc.id,
    aisle: doc.data().aisle,
    visits: doc.data().visits || 0,
    lastVisitedAt: doc.data().lastVisitedAt?.toDate?.()?.toISOString() || null,
  }));
};

module.exports = {
  getAisleScoreboard,
  recordAisleVisits,
};