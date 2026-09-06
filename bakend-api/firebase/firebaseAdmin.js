// Force IPv4-first DNS resolution, same reason as the top of index.js: on this
// network Node prefers Google's IPv6 addresses, which hang and then reset before
// TLS is established ("ECONNRESET ... before secure TLS connection was
// established"). index.js already sets this for the Express server, but the CLI
// scripts in scripts/ do not load index.js - without it here, Admin SDK REST calls
// such as auth().getUserByEmail() and setCustomUserClaims() fail intermittently.
// Firestore uses gRPC and is unaffected, which is why seeding always worked.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const admin = require('firebase-admin');
const config = require('../config/environment');

// Single Admin SDK initialisation point for the whole backend.
// Everything that needs Firebase (Firestore, Auth token verification, custom
// claims) must require this module instead of calling initializeApp itself,
// otherwise the SDK throws "app already exists" on the second init.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseProjectId,
      // The key is stored in .env as one line with literal \n escapes.
      privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
      clientEmail: config.firebaseClientEmail,
    }),
  });
}

module.exports = admin;
