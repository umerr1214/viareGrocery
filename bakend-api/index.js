const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const { getGeminiResponse } = require('./utils/gemini');
const pathOptimizer = require('./routes/pathOptimizer');
const alternativeSearch = require('./routes/alternativeSearch');

// Load environment variables from .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔁 Multer for handling image uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// 🔥 GEMINI Direct Endpoint
app.post('/api/suggest-direct', upload.array('files'), async (req, res) => {
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

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No image files uploaded.' });
        }

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
        console.error('Gemini Suggest Error:', err);
        res.status(500).json({ error: 'Failed to generate recommendation.' });
    }
});

app.use('/api/path', pathOptimizer);
app.use('/api/alternatives', alternativeSearch);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
