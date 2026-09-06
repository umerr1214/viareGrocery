const admin = require('../firebase/firebaseAdmin');

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <idToken>`
 * and attaches the caller identity to req.user.
 * Rejects with 401 when the header is missing, malformed, or the token is
 * invalid / expired / revoked.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        error: 'Missing auth token'
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      // Custom claims are only present once the Admin SDK has set them
      // (see scripts/makeStoreOwner.js). Everyone else is a customer.
      role: decoded.role || 'customer'
    };

    next();
  } catch (err) {
    // Log the real reason server-side, but never leak it to the client.
    console.error('🔒 Auth failed:', err.code || '', err.message || err);
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Role guard. Must run after `authenticate` so req.user is populated.
 * Usage: router.get('/x', authenticate, requireRole('store_owner'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireRole
};
