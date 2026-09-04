const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const config = require('../config/environment');
const { validateAlternativeSearch } = require('../middleware/validation');

// Instruct Gemini to return a strict JSON schema so the mobile app can render
// clean product cards instead of a raw wall of prose.
const JSON_SCHEMA_INSTRUCTION = `
Respond ONLY with a valid JSON object (no markdown, no code fences) that matches exactly this schema:
{
  "identifiedProduct": "<string: the product identified>",
  "bestAlternative": { "name": "<string>", "reason": "<string: one sentence on why this is the best choice>" },
  "alternatives": [
    {
      "name": "<string: alternative product name>",
      "brand": "<string: brand of the alternative>",
      "similarity": "<string: 1-2 sentences on how it is similar to the original>",
      "benefits": ["<string: benefit 1>", "<string: benefit 2>", "<string: benefit 3>"]
    }
  ]
}
Include 3-4 items in "alternatives". Keep each benefit short (under 15 words).`;

const JSON_GENERATION_CONFIG = {
    responseMimeType: 'application/json',
    temperature: 0.4,
};

router.post('/', validateAlternativeSearch, async (req, res, next) => {
    try {
        const { image, productName, category, brand } = req.body;
        
        let prompt = '';
        let requestBody = {};
        let apiUrl = '';

        if (image) {
            apiUrl = config.geminiVisionApiUrl;
            
            prompt = `Analyze this product image and find 3-4 best alternative products from different brands.
            Consider factors like quality, nutritional value, and similar benefits.
            Set "identifiedProduct" to the product you identify in the image.
            ${JSON_SCHEMA_INSTRUCTION}`;
            
            requestBody = {
                contents: [{
                    parts: [
                        {
                            text: prompt
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: image.split(',')[1]
                            }
                        }
                    ]
                }],
                generationConfig: JSON_GENERATION_CONFIG
            };
        } else {
            apiUrl = config.geminiTextApiUrl;
            
            prompt = `Find 3-4 best alternative products for "${productName}" from different brands in the "${category}" category.
            The user currently uses "${brand}" brand, so recommend alternatives from other brands.
            Consider factors like quality, nutritional value, and similar benefits.
            Set "identifiedProduct" to "${productName} (${brand}) - ${category}".
            ${JSON_SCHEMA_INSTRUCTION}`;
            
            requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: JSON_GENERATION_CONFIG
            };
        }
        
        const response = await fetch(`${apiUrl}?key=${config.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            res.json({ 
                success: true, 
                alternative: aiResponse 
            });
        } else {
            throw new Error('Invalid response from Gemini API');
        }

    } catch (error) {
        next(error);
    }
});

module.exports = router;
