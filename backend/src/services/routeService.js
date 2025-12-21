const axios = require('axios');
const Hazard = require('../models/Hazard'); 

// Helper: Calculate Distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
}

const calculateRoutes = async (start, end, weatherData) => {
    // 1. Sanitize Inputs (Remove spaces)
    const cleanStart = start.replace(/\s/g, '');
    const cleanEnd = end.replace(/\s/g, '');

    // 2. Get API Key (Check both names)
    const apiKey = process.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_KEY;

    if (!apiKey) {
        throw new Error("CRITICAL: Geoapify API Key is missing. Check your Render Environment Variables.");
    }

    // 3. Construct URL
    const geoapifyUrl = `https://api.geoapify.com/v1/routing?waypoints=${cleanStart}|${cleanEnd}&mode=drive&alternatives=3&apiKey=${apiKey}`;
    
    // 🔍 DEBUG LOG: Print this to see if it looks correct!
    console.log(`Fetching Route: ${geoapifyUrl.replace(apiKey, 'HIDDEN_KEY')}`); 

    const routeRes = await axios.get(geoapifyUrl);
    
    if (!routeRes.data.features || routeRes.data.features.length === 0) {
        throw new Error('No route found');
    }

    // 4. Fetch Active Hazards
    const activeHazards = await Hazard.find();

    // 5. Process Routes
    const analyzedRoutes = routeRes.data.features.map((feature, index) => {
        const distanceKm = feature.properties.distance / 1000;
        const originalTimeMins = feature.properties.time / 60;
        const routeCoordinates = feature.geometry.coordinates.flat();

        let baseRiskScore = 10; 

        // Weather Impact
        if (weatherData.precipitation > 0.5) baseRiskScore += 20;
        if (weatherData.windSpeed > 15) baseRiskScore += 10;
        if (originalTimeMins > 60) baseRiskScore += 5;

        let hazardPenalty = 0;
        let timeDelay = 0;
        let detectedHazards = [];

        activeHazards.forEach(h => {
            const isNear = routeCoordinates.some((coord, idx) => {
                if (idx % 15 !== 0) return false; 
                const lat = Array.isArray(coord) ? coord[1] : 0;
                const lon = Array.isArray(coord) ? coord[0] : 0;
                return getDistanceFromLatLonInKm(lat, lon, h.latitude, h.longitude) < 0.2;
            });

            if (isNear) {
                if(['Accident', 'Flooding'].includes(h.hazardType)) { hazardPenalty += 40; timeDelay += 20; }
                else if(h.hazardType === 'Pothole') { hazardPenalty += 15; timeDelay += 2; }
                else if(h.hazardType === 'Traffic') { hazardPenalty += 5; timeDelay += 15; }
                if (!detectedHazards.includes(h.hazardType)) detectedHazards.push(h.hazardType);
            }
        });

        let finalRiskScore = Math.min(100, baseRiskScore + hazardPenalty);
        let finalDuration = originalTimeMins + timeDelay;
        
        let color = '#059669'; 
        if (finalRiskScore > 40) color = '#d97706'; 
        if (finalRiskScore > 75) color = '#dc2626'; 

        return {
            id: index,
            geometry: feature.geometry,
            summary: {
                distance: `${distanceKm.toFixed(1)} km`,
                duration: `${Math.round(finalDuration)} min`,
                originalDuration: `${Math.round(originalTimeMins)} min`
            },
            safety: {
                score: Math.round(finalRiskScore),
                color: color,
                message: detectedHazards.length > 0 
                    ? `⚠️ Reported: ${detectedHazards.join(', ')}` 
                    : `AI Score: ${Math.round(finalRiskScore)}/100`
            }
        };
    });

    return analyzedRoutes;
};

module.exports = { calculateRoutes };