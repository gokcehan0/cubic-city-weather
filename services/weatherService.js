const axios = require("axios");

const GEO_URL = "http://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const getWeather = async (city) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("OpenWeather API Key missing");

    // 1. Get Coordinates
    const geoRes = await axios.get(GEO_URL, {
      params: { q: city, limit: 1, appid: apiKey },
    });

    if (!geoRes.data || geoRes.data.length === 0) {
      throw new Error("City not found");
    }

    const { lat, lon, name } = geoRes.data[0];

    // 2. Get Current Weather & Forecast in Parallel
    const [currentRes, forecastRes] = await Promise.all([
        axios.get(WEATHER_URL, { params: { lat, lon, units: "metric", lang: "tr", appid: apiKey } }),
        axios.get(FORECAST_URL, { params: { lat, lon, units: "metric", lang: "tr", appid: apiKey } })
    ]);

    const currentData = currentRes.data;
    const timezoneOffset = currentData.timezone; // Offset in seconds

    // 3. Process Forecast - Aggregate 3-hour intervals into Daily Summary
    const dailyData = {};
    
    forecastRes.data.list.forEach(item => {
        // Calculate city's local date for valid grouping
        const localTimeMs = (item.dt + timezoneOffset) * 1000;
        const dateKey = new Date(localTimeMs).toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                dt: item.dt,
                temps: [],
                weather: [],
                windSpeeds: [],
                pops: []
            };
        }
        
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].temps.push(item.main.temp_min); 
        dailyData[dateKey].temps.push(item.main.temp_max);
        dailyData[dateKey].weather.push(item.weather[0]);
        dailyData[dateKey].windSpeeds.push(item.wind.speed);
        dailyData[dateKey].pops.push(item.pop || 0);
    });

    // Helper: Format today's date in city's local time
    const startToday = new Date((Date.now() / 1000 + timezoneOffset) * 1000).toISOString().split('T')[0];
    
    const dailyForecast = Object.entries(dailyData)
        .filter(([dateKey]) => dateKey >= startToday)
        .slice(0, 7) // Ensure we get up to 7 days if available (usually 5-6 from free API)
        .map(([dateKey, data]) => {
            const min = Math.round(Math.min(...data.temps));
            const max = Math.round(Math.max(...data.temps));
            // Average Wind Speed
            const avgWind = (data.windSpeeds.reduce((a, b) => a + b, 0) / data.windSpeeds.length).toFixed(1);
            // Max Probability of Precipitation
            const maxPop = Math.round(Math.max(...data.pops) * 100);
            
            // Pick representative weather icon (middle of the day)
            const midIndex = Math.floor(data.weather.length / 2);
            const w = data.weather[midIndex];

            return {
                day: new Date(dateKey).toLocaleDateString("tr-TR", { weekday: "short" }),
                date: new Date(dateKey).toLocaleDateString("tr-TR", { day: 'numeric', month: 'numeric' }),
                max,
                min,
                description: w.description,
                icon: w.icon,
                wind_speed: avgWind,
                rain_prob: maxPop
            };
        });

    // Simple formatted time helper using offset
    const formatLocalTime = (unixTime, offset) => {
        return new Date((unixTime + offset) * 1000).toISOString().slice(11, 16);
    };

    return {
      city: name,
      city_id: currentData.id,
      temp: Math.round(currentData.main.temp),
      main: currentData.weather[0].main,
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
      icon: currentData.weather[0].icon,
      
      // Detailed Metrics
      wind_speed: currentData.wind.speed,
      sunrise: formatLocalTime(currentData.sys.sunrise, timezoneOffset),
      sunset: formatLocalTime(currentData.sys.sunset, timezoneOffset),
      // Use today's rain prob if available in forecast, else 0
      rain_prob: dailyForecast[0] ? dailyForecast[0].rain_prob : 0,

      forecast: dailyForecast,
    };
  } catch (error) {
    console.error("Weather Service Error:", error.message);
    throw error;
  }
};

const searchCity = async (query) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("OpenWeather API Key missing");

    const geoRes = await axios.get(GEO_URL, {
      params: { q: query, limit: 5, appid: apiKey },
    });

    return geoRes.data;
  } catch (error) {
    console.error("Search City Error:", error.message);
    throw error;
  }
};

module.exports = { getWeather, searchCity };
