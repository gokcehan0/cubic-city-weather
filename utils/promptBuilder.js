/**
 * Prompt Builder
 * Injects weather data into the user's base prompt.
 */

const buildPrompt = (basePrompt, weatherData) => {
    let prompt = basePrompt;

    // 1. Replace City Name if present in a specific format or just append
    // User format: "City name:【İstanbul】"
    // We'll replace the content inside the brackets or the whole line.
    prompt = prompt.replace(/City name:【.*?】/g, `City name:【${weatherData.city}】`);

    // 2. Inject Weather Conditions into the description
    // The prompt says: "Weather elements are creatively integrated..."
    // We should explicitly state the weather to ensure the AI knows it.
    const weatherInjection = `\nCurrent Weather Conditions: ${weatherData.condition}, Temperature: ${weatherData.temp}°C, Date: ${weatherData.date}. Ensure these are reflected in the scene.`;
    
    prompt += weatherInjection;

    return prompt;
};

module.exports = { buildPrompt };
