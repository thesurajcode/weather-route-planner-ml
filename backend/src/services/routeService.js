const axios = require('axios');
const Hazard = require('../models/Hazard'); 

// Helper: Calculate Distance between two GPS points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
}

const calculateRoutes = async (start, end, weatherData) => {
    // 1. Get Routes from Geoapify
    const apiKey = process.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_KEY;
    const geoapifyUrl = `https://api.geoapify.com/v1/routing?waypoints=${start}|${end}&mode=drive&alternatives=3&apiKey=${apiKey}`;
    
    if (!routeRes.data.features || routeRes.data.features.length === 0) {
        throw new Error('No route found');
    }

    // 2. Fetch Active Hazards from DB
    const activeHazards = await Hazard.find();

    // 3. Process Each Route (The AI Logic)
    const analyzedRoutes = routeRes.data.features.map((feature, index) => {
        const distanceKm = feature.properties.distance / 1000;
        const originalTimeMins = feature.properties.time / 60;
        const routeCoordinates = feature.geometry.coordinates.flat();

        // --- RISK ALGORITHM ---
        let baseRiskScore = 10; // Baseline

        // Weather Impact
        if (weatherData.precipitation > 0.5) baseRiskScore += 20;
        if (weatherData.windSpeed > 15) baseRiskScore += 10;
        if (originalTimeMins > 60) baseRiskScore += 5;

        // Hazard Impact
        let hazardPenalty = 0;
        let timeDelay = 0;
        let detectedHazards = [];

        activeHazards.forEach(h => {
            // Check if hazard is close (0.2km) to any point on route
            const isNear = routeCoordinates.some((coord, idx) => {
                if (idx % 15 !== 0) return false; // Check every 15th point for speed
                const lat = Array.isArray(coord) ? coord[1] : 0;
                const lon = Array.isArray(coord) ? coord[0] : 0;
                return getDistanceFromLatLonInKm(lat, lon, h.latitude, h.longitude) < 0.2;
            });

            if (isNear) {
                // Hazard Weights
                if(['Accident', 'Flooding'].includes(h.hazardType)) { hazardPenalty += 40; timeDelay += 20; }
                else if(h.hazardType === 'Pothole') { hazardPenalty += 15; timeDelay += 2; }
                else if(h.hazardType === 'Traffic') { hazardPenalty += 5; timeDelay += 15; }
                
                if (!detectedHazards.includes(h.hazardType)) detectedHazards.push(h.hazardType);
            }
        });

        // Finalize Scores
        let finalRiskScore = Math.min(100, baseRiskScore + hazardPenalty);
        let finalDuration = originalTimeMins + timeDelay;
        
        // Color Coding
        let color = '#059669'; // Green (Safe)
        if (finalRiskScore > 40) color = '#d97706'; // Orange (Moderate)
        if (finalRiskScore > 75) color = '#dc2626'; // Red (High)

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