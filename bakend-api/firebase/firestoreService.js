// Admin SDK init lives in ./firebaseAdmin so auth middleware and Firestore
// share a single app instance. This module keeps exporting the db so existing
// `require('./firestoreService')` callers keep working unchanged.
const admin = require('./firebaseAdmin');

const db = admin.firestore();
module.exports = db;
