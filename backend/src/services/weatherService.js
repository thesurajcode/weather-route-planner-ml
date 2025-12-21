const axios = require('axios');

const getWeatherForCoords = async (lat, lon) => {
    try {
        console.log(`Getting weather for ${lat}, ${lon}...`);
        
        // Use OpenWeatherMap since you have the key
        // Use the name exactly as it appears in your .env file
        const apiKey = process.env.OPENWEATHERMAP_API_KEY || process.env.WEATHER_API_KEY; 
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        // Map OpenWeatherMap data to our App's format
        return {
            temperature: data.main.temp,
            precipitation: data.rain ? (data.rain['1h'] || 0) : 0, // Fallback if no rain
            windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
            condition: data.weather[0].main,
            description: data.weather[0].description,
            aqi: 120 // Mock AQI (since standard API doesn't send it)
        };

    } catch (error) {
        console.error("❌ Weather API Error:", error.message);
        // Fallback (so app doesn't crash if API key fails)
        return {
            temperature: 25,
            precipitation: 0,
            windSpeed: 5,
            condition: "Unknown",
            description: "Clear",
            aqi: 50
        };
    }
};

module.exports = { getWeatherForCoords };