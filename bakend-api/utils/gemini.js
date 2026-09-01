const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getGeminiResponse({ images, prompt, category }) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const imageParts = await Promise.all(
        images.map((file) => ({
            inlineData: {
                data: file.buffer.toString('base64'),
                mimeType: file.mimetype,
            }
        }))
    );

    const result = await model.generateContent({
        contents: [{
            role: "user",
            parts: [
                { text: prompt },
                ...imageParts
            ]
        }]
    });

    const response = await result.response;
    return response.text();
}

module.exports = { getGeminiResponse };
