const User = require('../models/User');
const CityImage = require('../models/CityImage');
const { getWeather, searchCity } = require('../services/weatherService');
const { generateImage } = require('../services/imageService');
const { buildPrompt } = require('../utils/promptBuilder');

const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

const updateCity = async (req, res) => {
  try {
    const { city } = req.body;
    console.log('[UpdateCity] Request:', city);
    
    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.city = city.trim();
    await user.save();
    
    console.log(`[UpdateCity] Success: ${user.username} -> ${city}`);
    
    res.status(200).json({
      _id: user._id,
      username: user.username,
      city: user.city,
      message: `City updated to ${city}`
    });
  } catch (error) {
    console.error('[UpdateCity] Error:', error);
    res.status(500).json({ message: 'Failed to update city: ' + error.message });
  }
};

const PROMPT_TEMPLATE = `Present a clear, 45° top-down view of a vertical (9:16) isometric miniature 3D cartoon scene, highlighting iconic landmarks centered in the composition to showcase precise and delicate modeling.

The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects. Weather elements are creatively integrated into the urban architecture, establishing a dynamic interaction between the city's landscape and atmospheric conditions, creating an immersive weather ambiance.

Use a clean, unified composition with minimalistic aesthetics and a soft, solid-colored background that highlights the main content. The overall visual style is fresh and soothing.

IMPORTANT: Do NOT add any text, weather icons, dates, or temperature information to the image. Keep the composition clean and focused on the cityscape. Leave the upper-center area slightly more open for external overlay placement, but maintain visual balance.

Please retrieve current weather conditions for the specified city before rendering to ensure weather ambiance matches current conditions.

City name:【CITY_PLACEHOLDER】`;

const getWidgetData = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    if (!req.user) {
        return res.status(401).json({ message: 'User context missing' });
    }

    // Use user data directly from request (no need to query DB again)
    const trimmedCity = req.user.city.trim();

    console.log(`[WidgetData] User: ${req.user.username}, City: ${trimmedCity}`);

    // Always fetch fresh weather data
    let weatherData;
    try {
        weatherData = await getWeather(trimmedCity);
        console.log('[WidgetData] Weather fetched:', weatherData.city);
    } catch (e) {
        console.error('[WidgetData] Weather fetch failed:', e.message);
        return res.status(500).json({ message: 'Failed to fetch weather data: ' + e.message });
    }

    // Check if we have an image for this city (no date check!)
    let cityImage = await CityImage.findOne({ city: trimmedCity });

    if (!cityImage) {
        console.log(`[WidgetData] No image exists for ${trimmedCity}, generating...`);
        
        const prompt = buildPrompt(PROMPT_TEMPLATE.replace('CITY_PLACEHOLDER', trimmedCity), weatherData);
        const imageUrl = await generateImage(prompt, trimmedCity, 'permanent');
        
        cityImage = await CityImage.create({
            city: trimmedCity,
            imageUrl: imageUrl,
            weatherData: weatherData
        });
        
        console.log(`[WidgetData] Image created for ${trimmedCity}`);
    } else {
        console.log(`[WidgetData] Using existing image for ${trimmedCity} (created: ${cityImage.createdAt})`);
    }

    // Fix localhost URLs for mobile app
    // Fix localhost URLs for mobile app
    let finalImageUrl = cityImage.imageUrl;
    // Check for common local development URLs including 192.168.x.x
    if (finalImageUrl.match(/http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?/)) {
        // Replace protocol://host:port with production domain
        finalImageUrl = finalImageUrl.replace(/http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?/, 'https://cubic-weather-api.onrender.com');
    }

    res.json({
        city: trimmedCity,
        imageUrl: finalImageUrl,
        generatedAt: cityImage.createdAt,
        weather: weatherData,
        source: 'permanent'
    });

  } catch (error) {
    console.error('[WidgetData] Error:', error);
    res.status(500).json({ message: 'Failed to get widget data' });
  }
};



const searchCities = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json([]);
        }

        const results = await searchCity(query);
        res.json(results);
    } catch (error) {
        console.error('[SearchCity] Error:', error.message);
        res.status(500).json({ message: 'Failed to search cities' });
    }
};

module.exports = {
  getMe,
  updateCity,
  getWidgetData,
  searchCities
};
