const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const generateImage = async (prompt, cityName, date) => {
    try {
        
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: prompt,
        });
        
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    const buffer = Buffer.from(base64Data, "base64");
                    
                    // Create city-images directory if not exists
                    const cityImagesDir = path.join(__dirname, '../public/city-images');
                    if (!fs.existsSync(cityImagesDir)) {
                        fs.mkdirSync(cityImagesDir, { recursive: true });
                    }
                    
                    // Generate filename based on city and date
                    const safeCity = cityName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    const filename = `${safeCity}_${date}.png`;
                    const filePath = path.join(cityImagesDir, filename);
                    
                    // Save to file
                    fs.writeFileSync(filePath, buffer);

                    // Use BASE_URL from environment or build dynamically
                    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
                    return `${baseUrl}/city-images/${filename}`;
                }
            }
        }

        throw new Error("No image data found in response candidates.");

    } catch (error) {
        console.error("Error in generateImage:", error);
        throw error;
    }
};

module.exports = { generateImage };

