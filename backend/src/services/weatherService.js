const axios = require('axios');

const getWeatherForCoords = async (lat, lon) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY; //
    try {
        // Fetch Meteorological data
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        // Fetch Air Quality Index (AQI)
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        const [wRes, aRes] = await Promise.all([axios.get(weatherUrl), axios.get(aqiUrl)]);

        return {
            temperature: wRes.data.main.temp,
            precipitation: wRes.data.rain ? (wRes.data.rain['1h'] || 0) : 0,
            windSpeed: (wRes.data.wind.speed * 3.6).toFixed(1), // km/h
            aqi: aRes.data.list[0].main.aqi, // 1-5 Scale
            condition: wRes.data.weather[0].main
        };
    } catch (error) {
        return { temperature: 25, precipitation: 0, windSpeed: 5, aqi: 1, condition: "Clear" };
    }
};

module.exports = { getWeatherForCoords };