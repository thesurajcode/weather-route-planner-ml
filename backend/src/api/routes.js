const express = require('express');
const router = express.Router();
const Hazard = require('../models/Hazard');
const { calculateRoutes } = require('../services/routeService');
const { getWeatherForCoords } = require('../services/weatherService');

// --- GET ROUTE (The Brain) ---
router.post('/route', async (req, res) => {
    const { start, end } = req.body; // Expects "lat,lon" strings
    if (!start || !end) return res.status(400).json({ error: 'Start and End required.' });

    try {
        // 1. Get Weather for the starting point
        const [startLat, startLon] = start.split(',');
        const weather = await getWeatherForCoords(startLat, startLon);

        // 2. Calculate Routes (using our new Service)
        const analyzedRoutes = await calculateRoutes(start, end, weather);

        // 3. Sort Results
        const fastest = [...analyzedRoutes].sort((a, b) => 
            parseFloat(a.summary.duration) - parseFloat(b.summary.duration)
        )[0];

        const safest = [...analyzedRoutes].sort((a, b) => 
            a.safety.score - b.safety.score
        )[0];

        // 4. Send Response
        res.json({
            weather,
            routes: { fastest, safest, count: analyzedRoutes.length },
            recommendation: {
                shouldWait: weather.precipitation > 2.0 || safest.safety.score > 80,
                text: safest.safety.score > 80 
                    ? "⚠️ HIGH RISK: Hazards detected. Recommend delaying travel." 
                    : "✅ Conditions are good. Use the Safe Route."
            }
        });

    } catch (error) {
        console.error("Route Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- HAZARD REPORTING ---
router.post('/report-hazard', async (req, res) => {
    try {
        const { latitude, longitude, hazardType, description } = req.body;
        const newReport = new Hazard({ latitude, longitude, hazardType, description });
        await newReport.save();
        res.status(201).json({ message: 'Reported', report: newReport });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

router.get('/hazards', async (req, res) => {
    try {
        const hazards = await Hazard.find().sort({ reportedAt: -1 });
        res.json(hazards);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;