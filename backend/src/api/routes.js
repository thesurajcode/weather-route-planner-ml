const express = require('express');
const router = express.Router();
const { calculateRoutes, getCoordinates } = require('../services/routeService');
const { getWeatherForCoords } = require('../services/weatherService');
const Hazard = require('../models/Hazard');

router.post('/route', async (req, res) => {
    const { start, end } = req.body;
    try {
        // 1. Convert text to coordinates for weather and routing
        const startCoords = await getCoordinates(start);
        const [lat, lon] = startCoords.split(',');

        // 2. Fetch Real-time Weather and AQI
        const weather = await getWeatherForCoords(lat, lon);

        // 3. Analyze 3 alternative routes from Geoapify
        const analyzedRoutes = await calculateRoutes(start, end, weather);

        // 4. Optimization: Identify distinct routes
        // Safest = Lowest combined AI/Hazard score
        const safest = [...analyzedRoutes].sort((a, b) => a.safety.score - b.safety.score)[0];
        // Fastest = Shortest raw duration
        const fastest = [...analyzedRoutes].sort((a, b) => a.summary.rawDuration - b.summary.rawDuration)[0];

        res.json({
            weather,
            routes: { fastest, safest },
            recommendation: {
                text: safest.safety.score > 70 
                    ? "⚠️ High Risk detected. AI recommends the Safest Route." 
                    : "✅ Conditions are stable. Fastest Route is recommended."
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hazard Reporting Endpoints
router.post('/report-hazard', async (req, res) => {
    try {
        const newReport = new Hazard(req.body);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (err) { res.status(500).json({ error: 'Failed to report' }); }
});

router.get('/hazards', async (req, res) => {
    try {
        const hazards = await Hazard.find().sort({ reportedAt: -1 });
        res.json(hazards);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch' }); }
});

module.exports = router;