const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyBtn9Bx3aKShyQfJlqagp7tgxDPTgovHq0';
const GEMINI_TEXT_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

router.post('/', async (req, res) => {
    try {
        const { image, productName, category, brand } = req.body;
        
        if (!image && (!productName || !category || !brand)) {
            return res.status(400).json({ 
                error: 'Either image or all of product name, category, and brand are required' 
            });
        }

        let prompt = '';
        let requestBody = {};
        let apiUrl = '';

        if (image) {
            apiUrl = GEMINI_VISION_API_URL;
            
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
            apiUrl = GEMINI_TEXT_API_URL;
            
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
        
        const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
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
        console.error('Error in alternative search:', error);
        res.status(500).json({ 
            error: 'Failed to get alternatives', 
            details: error.message 
        });
    }
});

module.exports = router; 