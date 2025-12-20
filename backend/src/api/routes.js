const express = require('express');
const router = express.Router();

// 1. Import Services
const { getRouteFromOSRM, getCoordsFromAddress } = require('../services/mapService');
const { getWeatherForCoords } = require('../services/weatherService'); 
const { getRiskScore } = require('../services/riskAnalysisService');

// 2. Import the Hazard Model (New!)
const Hazard = require('../models/Hazard');

// ==========================================
//  EXISTING ROUTE: Calculate Safe Path
// ==========================================
router.post('/route', async (req, res) => {
  try {
    const { start, end } = req.body;
    if (!start || !end) return res.status(400).json({ error: 'Start and end required.' });
    
    // 1. Get Coordinates [lon, lat]
    const startCoords = await getCoordsFromAddress(start);
    const endCoords = await getCoordsFromAddress(end);
    
    // 2. Get Route (Geoapify)
    const routes = await getRouteFromOSRM(startCoords, endCoords);
    const bestRoute = routes[0]; 

    // 3. Get Weather (Simple Midpoint Math)
    const midLat = (startCoords[1] + endCoords[1]) / 2;
    const midLon = (startCoords[0] + endCoords[0]) / 2;

    console.log(`📍 Weather Midpoint: ${midLat.toFixed(4)}, ${midLon.toFixed(4)}`);

    const weatherInfo = await getWeatherForCoords(midLat, midLon);

    // 4. Analyze Risks
    let analyzedRoutes = [];
    for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const safetyAnalysis = await getRiskScore(weatherInfo, route);
        
        // Add variance for demo
        if (i === 1) safetyAnalysis.score = Math.max(0, safetyAnalysis.score - 10);
        if (i === 2) safetyAnalysis.score = Math.min(100, safetyAnalysis.score + 15);

        analyzedRoutes.push({
            id: i,
            geometry: route.geometry,
            summary: { 
                distance: (route.legs[0].distance / 1000).toFixed(1) + " km", 
                duration: Math.round(route.legs[0].duration / 60) + " min" 
            },
            safety: safetyAnalysis
        });
    }

    // 5. Ensure multiple routes exist for buttons (Demo Logic)
    if (analyzedRoutes.length < 2) {
        const base = analyzedRoutes[0];
        const baseDist = parseFloat(base.summary.distance);
        const baseDur = parseInt(base.summary.duration);

        analyzedRoutes.push({
            ...base, id: 1,
            summary: { distance: (baseDist * 1.05).toFixed(1) + " km", duration: Math.round(baseDur * 1.1) + " min" },
            safety: { score: 20, message: "AI: Low Risk (Safe Route)", color: "#00cc66", factors: ["Low Traffic"] }
        });
        analyzedRoutes.push({
            ...base, id: 2,
            summary: { distance: (baseDist * 0.98).toFixed(1) + " km", duration: Math.round(baseDur * 0.95) + " min" },
            safety: { score: 85, message: "AI: High Risk (Fastest)", color: "#ff4d4d", factors: ["High Speed"] }
        });
    }

    // 6. Recommendation
    let recommendation = null;
    if (weatherInfo && analyzedRoutes.length > 0) {
        const shouldWait = weatherInfo.condition.includes("Rain") || analyzedRoutes[0].safety.score > 60;
        recommendation = shouldWait 
            ? { shouldWait: true, text: `💡 Tip: Wait for weather to clear.`, color: '#fff3cd', borderColor: '#ffeeba' }
            : { shouldWait: false, text: "✅ Safe to travel.", color: '#d4edda', borderColor: '#c3e6cb' };
    }

    // 7. Sort and Return
    const sortedBySafety = [...analyzedRoutes].sort((a, b) => a.safety.score - b.safety.score);
    const sortedByTime = [...analyzedRoutes].sort((a, b) => parseFloat(a.summary.duration) - parseFloat(b.summary.duration));

    res.json({
        routes: { safest: sortedBySafety[0], moderate: analyzedRoutes[0], fastest: sortedByTime[0], count: 3 },
        weather: weatherInfo,
        recommendation: recommendation
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
//  NEW ROUTES: Hazard Reporting (Crowdsourcing)
// ==========================================

// POST: Report a new hazard
router.post('/report-hazard', async (req, res) => {
  try {
    const { latitude, longitude, hazardType, description } = req.body;

    // Validate input
    if (!latitude || !longitude || !hazardType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a new report
    const newReport = new Hazard({
      latitude,
      longitude,
      hazardType,
      description
    });

    // Save to MongoDB
    await newReport.save();

    console.log('📝 New Hazard Reported:', hazardType);
    res.status(201).json({ message: 'Hazard reported successfully!', report: newReport });

  } catch (error) {
    console.error('Error saving hazard:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET: Fetch all hazards (For displaying on the map)
router.get('/hazards', async (req, res) => {
  try {
    const hazards = await Hazard.find().sort({ reportedAt: -1 }); // Newest first
    res.json(hazards);
  } catch (error) {
    console.error('Error fetching hazards:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;