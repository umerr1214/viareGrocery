// Force IPv4-first DNS resolution.
// On this network, Node's built-in fetch (undici) prefers Google's IPv6 addresses
// (the 2001:4860:: block) for generativelanguage.googleapis.com, which hang ~10s and
// then reset -> "TypeError: fetch failed" (ECONNRESET) before TLS is established.
// Preferring IPv4 avoids the broken IPv6 route. This is process-global, so it also
// fixes the REST path in config/environment.js / routes/alternativeSearch.js.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');
const { validateImageUpload } = require('./middleware/validation');
const { authenticate, requireRole } = require('./middleware/authMiddleware');
const { getGeminiResponse } = require('./utils/gemini');
const pathOptimizer = require('./routes/pathoptimizer');
const alternativeSearch = require('./routes/alternativeSearch');
const ownerAnalytics = require('./routes/ownerAnalytics');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: config.maxFileSize }));
app.use(express.urlencoded({ limit: config.maxFileSize, extended: true }));

// Multer configuration for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname}`), false);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv 
  });
});

// 🔥 GEMINI Direct Endpoint
// authenticate runs before multer so unauthenticated callers are rejected
// without the server having to buffer their upload first.
app.post('/api/suggest-direct', authenticate, upload.array('files'), validateImageUpload, async (req, res, next) => {
    try {
        const files = req.files;
        const category = req.body.category || '';
        
        const prompt = `You are a smart grocery shopping assistant. Analyze the product image(s) from the "${category || 'general'}" category.

Return ONLY valid JSON with no markdown, no code fences and no extra text, in EXACTLY this shape:
{
  "products": [
    {
      "name": "short product name",
      "brand": "brand name",
      "rating": 4.2,
      "price": "$4.50 - $6.50",
      "pros": ["concise benefit", "concise benefit"],
      "cons": ["concise concern"],
      "storage": "one short storage tip"
    }
  ],
  "bestPick": {
    "name": "product name",
    "reason": "one short sentence on why it wins"
  }
}

Rules:
- "rating" is a number from 0 to 5 (one decimal allowed).
- Keep strings SHORT: at most 3 pros and 2 cons, each 6 words or fewer.
- Add one entry in "products" for each distinct product visible.
- "bestPick" must reference one of the products.
- Use only the keys shown above.`;

        const recommendation = await getGeminiResponse({ images: files, prompt, category });

        res.json({ recommendation });
    } catch (err) {
        next(err);
    }
});

// API Routes (all require a valid Firebase ID token)
app.use('/api/path', authenticate, pathOptimizer);
app.use('/api/alternatives', authenticate, alternativeSearch);
app.use('/api/owner', authenticate, requireRole('store_owner'), ownerAnalytics);

// Role-split plumbing proof. Deliberately trivial: it exists only to confirm
// that authenticate + requireRole work end to end, so a customer token gets 403
// and a store_owner token gets 200. Delete or repurpose once a real
// store-owner endpoint lands.
app.get('/api/owner/ping', authenticate, requireRole('store_owner'), (req, res) => {
  res.json({
    ok: true,
    uid: req.user.uid,
    role: req.user.role
  });
});

// 404 handler - use proper catch-all pattern for Express 4.x
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
    console.log(`✅ Server running on http://localhost:${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});