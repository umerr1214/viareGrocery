const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const config = require('../config/environment');
const { validateAlternativeSearch } = require('../middleware/validation');

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
            Provide detailed recommendations with alternative product names from other brands, how they are similar, 
            and their key benefits. Format the response in a clear, user-friendly way.
            
            Please provide your response in this format:
            🔍 Product Analysis & Alternatives
            
            Product Identified: [What product this appears to be]
            
            Alternative 1: [Product Name from different brand]
            Similarity: [How it's similar to the original]
            Key Benefits: [2-3 main benefits]
            
            Alternative 2: [Product Name from different brand]
            Similarity: [How it's similar to the original]
            Key Benefits: [2-3 main benefits]
            
            Alternative 3: [Product Name from different brand]
            Similarity: [How it's similar to the original]
            Key Benefits: [2-3 main benefits]`;
            
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
                }]
            };
        } else {
            apiUrl = config.geminiTextApiUrl;
            
            prompt = `Find 3-4 best alternative products for "${productName}" from different brands in the "${category}" category. 
            The user currently uses "${brand}" brand, so recommend alternatives from other brands.
            Consider factors like quality, nutritional value, and similar benefits.
            Provide detailed recommendations with alternative product names from other brands, how they are similar, 
            and their key benefits. Format the response in a clear, user-friendly way.
            
            Please provide your response in this format:
            🔍 Product Analysis & Alternatives
            
            Original Product: ${productName} (${brand}) - ${category}
            
            Alternative 1: [Product Name from different brand]
            Similarity: [How it's similar to ${productName}]
            Key Benefits: [2-3 main benefits]
            
            Alternative 2: [Product Name from different brand]
            Similarity: [How it's similar to ${productName}]
            Key Benefits: [2-3 main benefits]
            
            Alternative 3: [Product Name from different brand]
            Similarity: [How it's similar to ${productName}]
            Key Benefits: [2-3 main benefits]`;
            
            requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
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