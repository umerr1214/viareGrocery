const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getGeminiResponse } = require('../utils/gemini');

// In-memory file upload
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;

        const prompt = `
You are a smart grocery shopping assistant. I’ll send you images of products.
Identify them and provide a comparison (name, price, expiry, fat %, rating).
End with a bullet: “👉 Best Pick: ...”
        `;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No image files uploaded.' });
        }

        const aiResponse = await getGeminiResponse({ images: files, prompt });

        res.json({ recommendation: aiResponse });

    } catch (err) {
        console.error('❌ Suggest API Error:', err);
        res.status(500).json({ error: 'Failed to generate recommendation.' });
    }
});

module.exports = router;
