// backend/src/services/weatherService.js
const axios = require('axios');

const getWeatherForCoords = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY; 

  // URLs for Current Weather, Air Quality, and Forecast
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    // 1. Fetch ALL data in parallel (Fastest way)
    const [weatherRes, aqiRes, forecastRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(aqiUrl),
      axios.get(forecastUrl)
    ]);

    const weatherData = weatherRes.data;
    const aqiData = aqiRes.data;
    const forecastData = forecastRes.data;

    // 2. Extract AQI
    const aqiValue = aqiData.list ? aqiData.list[0].main.aqi : 0;
    const aqiTextMap = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Hazardous" };

    // 3. Extract FUTURE Weather (approx 3 hours later)
    // .list[0] is now, .list[1] is +3 hours, .list[2] is +6 hours
    const later = forecastData.list[1]; 

    // 4. Build the combined summary
    const summary = {
      // Current Conditions
      condition: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      temperature: weatherData.main.temp,
      windSpeed: weatherData.wind.speed,
      aqi: aqiValue,
      aqiText: aqiTextMap[aqiValue] || "Unknown",
      
      // Future Conditions (+3 Hours)
      future: {
        condition: later.weather[0].main,
        temp: later.main.temp,
        // Format time nicely (e.g., "05:30 PM")
        time: new Date(later.dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }
    };
    
    console.log(`✅ Weather Data Fetched: Now=${summary.condition}, Later=${summary.future.condition}`);
    return summary;

  } catch (error) {
    console.error("❌ Weather API Error:", error.message);
    return null;
  }
};

module.exports = { getWeatherForCoords };