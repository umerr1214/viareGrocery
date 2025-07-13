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
        const prompt = `
You are a smart grocery shopping assistant. I'll send you images of products.
Identify them and provide a comparison (name, price, expiry, fat %, rating).
End with a bullet: "👉 Best Pick: ..."
        `;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No image files uploaded.' });
        }

        const aiResponse = await getGeminiResponse({ images: files, prompt });

        res.json({ recommendation: aiResponse });
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
