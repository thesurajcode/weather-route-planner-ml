const axios = require('axios');
const Hazard = require('../models/Hazard');
const ML_API_URL = "https://weather-route-planner-ml.onrender.com/predict";

async function getCoordinates(location) {
    const apiKey = process.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_KEY;
    const coordPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (coordPattern.test(location.replace(/\s/g, ''))) return location.replace(/\s/g, '');

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${apiKey}`;
    const res = await axios.get(url);
    if (res.data.features?.length > 0) {
        const { lat, lon } = res.data.features[0].properties;
        return `${lat},${lon}`;
    }
    throw new Error(`Location not found: ${location}`);
}

function getDist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const calculateRoutes = async (start, end, weatherData) => {
    const apiKey = process.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_KEY;
    const startCoords = await getCoordinates(start);
    const endCoords = await getCoordinates(end);

    const geoapifyUrl = `https://api.geoapify.com/v1/routing?waypoints=${startCoords}|${endCoords}&mode=drive&alternatives=3&apiKey=${apiKey}`;
    const routeRes = await axios.get(geoapifyUrl);
    
    const activeHazards = await Hazard.find();

    return await Promise.all(routeRes.data.features.map(async (feature, index) => {
        const routeCoords = feature.geometry.coordinates.flat();
        const duration = feature.properties.time / 60;

        // Spatial Query: 300m Buffer Analysis
        let localHazards = 0;
        activeHazards.forEach(h => {
            const isNear = routeCoords.some((c, i) => i % 20 === 0 && getDist(c[1], c[0], h.latitude, h.longitude) < 0.3);
            if (isNear) localHazards++;
        });

        let mlScore = 15;
        try {
            const mlRes = await axios.post(ML_API_URL, {
                temp: weatherData.temperature,
                precip: weatherData.precipitation,
                wind: weatherData.windSpeed,
                hazards: localHazards
            });
            mlScore = mlRes.data.score || 15;
        } catch (e) { console.warn("ML Fallback used."); }

        return {
            id: index,
            geometry: feature.geometry,
            summary: {
                distance: `${(feature.properties.distance / 1000).toFixed(1)} km`,
                duration: `${Math.round(duration)} min`,
                rawDuration: duration
            },
            safety: {
                score: Math.round(mlScore + (localHazards * 10)),
                hazardCount: localHazards
            }
        };
    }));
};

module.exports = { calculateRoutes, getCoordinates };