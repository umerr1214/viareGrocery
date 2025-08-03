const express = require('express');
const cors = require('cors');
const multer = require('multer');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');
const { validateImageUpload } = require('./middleware/validation');
const { getGeminiResponse } = require('./utils/gemini');
const pathOptimizer = require('./routes/pathOptimizer');
const alternativeSearch = require('./routes/alternativeSearch');

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
app.post('/api/suggest-direct', upload.array('files'), validateImageUpload, async (req, res, next) => {
    try {
        const files = req.files;
        const category = req.body.category || '';
        
        const prompt = `
You are a smart grocery shopping assistant. I'll send you images of products from the ${category} category.

Please analyze these product images and provide:
1. Product identification (what each product is)
2. Quality assessment (freshness, packaging, etc.)
3. Value comparison (price vs quality)
4. Health/nutritional considerations
5. Storage recommendations

For each product, provide:
- Product name and brand
- Quality rating (1-5 stars)
- Price estimate (if visible)
- Key features/benefits
- Any concerns or recommendations

End with a clear recommendation: "👉 Best Pick: [Product Name] - [Brief reason why]"

Make your response helpful, detailed, and easy to understand for grocery shoppers.
        `;

        // Hardcoded response for demo
        const hardcodedResponse = `
🍃 Product Analysis: Tea & Coffee Category

Olpers Milk (1L)
- Product: Full cream milk by Olpers
- Quality Rating: ⭐⭐⭐⭐⭐ (5/5 stars)
- Price Estimate: ~Rs. 180-200
- Key Features:
  • Rich, creamy texture perfect for tea/coffee
  • High calcium content (120mg per 100ml)
  • Pasteurized and homogenized for safety
  • 3.5% fat content for rich taste
  • Long shelf life when refrigerated

Quality Assessment:
✅ Fresh packaging with no leaks
✅ Proper refrigeration maintained
✅ Clear expiry date visible
✅ No signs of spoilage

Value Comparison:
• Olpers Milk: Premium quality, trusted brand
• Alternative: Local dairy milk (cheaper but less consistent quality)
• Best for: Tea, coffee, cooking, and direct consumption

Health Considerations:
• Rich in calcium and vitamin D
• Good source of protein (3.2g per 100ml)
• Contains essential vitamins A, B12, and D
• Suitable for all age groups

Storage Recommendations:
• Keep refrigerated at 2-4°C
• Consume within 7 days after opening
• Store in original container
• Avoid exposure to direct sunlight

👉 **Best Pick: Olpers Milk** - Premium quality, consistent taste, perfect for tea and coffee preparation. The rich creaminess enhances the flavor of your beverages while providing essential nutrients.
        `;

        res.json({ recommendation: hardcodedResponse });
    } catch (err) {
        next(err);
    }
});

// API Routes
app.use('/api/path', pathOptimizer);
app.use('/api/alternatives', alternativeSearch);

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
