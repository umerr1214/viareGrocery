const admin = require('firebase-admin');
const config = require('../config/environment');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseProjectId,
      privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
      clientEmail: config.firebaseClientEmail,
    }),
  });
}

const db = admin.firestore();
module.exports = db;
