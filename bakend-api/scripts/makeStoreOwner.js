const admin = require('../firebase/firebaseAdmin');
const db = require('../firebase/firestoreService');

// Grants the store_owner role to an existing Firebase Auth user.
//
// Two things are written, because they serve different readers:
//   1. A `role` custom claim - baked into the user's ID token, so the backend's
//      authenticate middleware can authorise without a Firestore read per request.
//   2. The users/{uid} doc - the client-readable copy AuthContext falls back to.
//
// Only the Admin SDK can set custom claims, which is what makes the role
// unforgeable: there is no client-side path to store_owner.
//
// Usage:
//   node scripts/makeStoreOwner.js owner@email.com
//   npm run make-owner -- owner@email.com

async function makeStoreOwner(email) {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      throw new Error(`No Firebase Auth user found for "${email}". They must sign up in the app first.`);
    }
    throw err;
  }

  console.log(`Found user: ${user.uid} (${user.email})`);

  const currentRole = (user.customClaims && user.customClaims.role) || 'customer';
  if (currentRole === 'store_owner') {
    console.log('ℹ️  Already a store owner - nothing to change.');
    return user;
  }

  // setCustomUserClaims REPLACES the whole claims object, so if you later add
  // other claims they must be included here too or they will be dropped.
  await admin.auth().setCustomUserClaims(user.uid, { role: 'store_owner' });
  console.log('✅ Custom claim set: role = store_owner');

  // merge:true also creates the doc when it is missing, which matters for
  // accounts created before the users/{uid} write worked - the Admin SDK
  // bypasses Firestore security rules, so this always succeeds.
  await db.collection('users').doc(user.uid).set(
    {
      email: user.email,
      role: 'store_owner',
      promotedAt: Date.now(),
    },
    { merge: true }
  );
  console.log(`✅ Firestore users/${user.uid} updated (role = store_owner)`);

  return user;
}

async function main() {
  const email = process.argv[2];

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('❌ A valid email argument is required.');
    console.error('   Usage: node scripts/makeStoreOwner.js owner@email.com');
    console.error('      or: npm run make-owner -- owner@email.com');
    process.exit(1);
  }

  console.log(`Promoting ${email} to store owner...\n`);
  const user = await makeStoreOwner(email);

  console.log('\n⚠️  Custom claims only take effect when a NEW ID token is issued.');
  console.log(`    ${user.email} must sign out and back in (or wait up to an hour for`);
  console.log('    token refresh) before the backend will see role = store_owner.');
  console.log('\nDone.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
  });
