const express = require('express');
const router = express.Router();
const axios = require('axios');
const Hazard = require('../models/Hazard'); // Import MongoDB Model
// If you have a separate ML service file, import it. 
// For this updated code, I have included the logic directly to ensure it runs immediately.

// ==========================================
// 1. HELPER: Haversine Formula (Distance Calculation)
// ==========================================
// This is used to check if a route point is close to a reported hazard.
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// ==========================================
// 2. MAIN ROUTE CALCULATION
// ==========================================
router.post('/route', async (req, res) => {
  const { start, end } = req.body;

  if (!start || !end) return res.status(400).json({ error: 'Start and End required.' });

  try {
    // --- STEP A: Fetch Real-Time Data ---
    
    // 1. Fetch Active Hazards from MongoDB
    const activeHazards = await Hazard.find();

    // 2. Fetch Weather (Open-Meteo) - Using a central point for simplicity
    // In a full production app, you would fetch weather for the exact route path.
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current=temperature_2m,precipitation,wind_speed_10m`
    );
    const weather = {
      temperature: weatherRes.data.current.temperature_2m,
      precipitation: weatherRes.data.current.precipitation,
      windSpeed: weatherRes.data.current.wind_speed_10m,
      aqi: 120 // Mock AQI or fetch from real API if available
    };

    // 3. Fetch Real Routes from Geoapify
    // KEY CHANGE: alternatives=3 asks for DIFFERENT physical paths
    const geoapifyUrl = `https://api.geoapify.com/v1/routing?waypoints=${start}|${end}&mode=drive&alternatives=3&apiKey=${process.env.GEOAPIFY_KEY}`;
    const routeRes = await axios.get(geoapifyUrl);
    
    if (!routeRes.data.features || routeRes.data.features.length === 0) {
      return res.status(404).json({ error: 'No route found' });
    }

    // --- STEP B: The Hybrid Risk Algorithm ---
    
    const analyzedRoutes = routeRes.data.features.map((feature, index) => {
      
      const distanceKm = feature.properties.distance / 1000;
      const originalTimeMins = feature.properties.time / 60;
      const routeCoordinates = feature.geometry.coordinates.flat(); // Flatten nested arrays

      // 1. BASELINE ML PREDICTION (Weather + CSV History)
      // This mimics your Python ML Model logic
      let baseRiskScore = 10; // Start with low risk
      
      // Weather Impact
      if (weather.precipitation > 0.5) baseRiskScore += 20; // Rain adds risk
      if (weather.windSpeed > 15) baseRiskScore += 10;      // Wind adds risk
      if (originalTimeMins > 60) baseRiskScore += 5;        // Longer exposure adds slight risk

      // 2. REAL-TIME HAZARD CHECK (The "Novelty")
      let hazardPenalty = 0;
      let timeDelay = 0;
      let detectedHazards = [];

      activeHazards.forEach(h => {
        // Check if hazard is within 200m (0.2km) of ANY point on this route
        // We sample every 10th point to improve performance
        const isNear = routeCoordinates.some((coord, idx) => {
            if (idx % 10 !== 0) return false; // Optimization
            const lat = Array.isArray(coord) ? coord[1] : 0;
            const lon = Array.isArray(coord) ? coord[0] : 0;
            return getDistanceFromLatLonInKm(lat, lon, h.latitude, h.longitude) < 0.2; 
        });

        if (isNear) {
            // RESEARCH GOLD: Weighted Impact Logic
            switch(h.hazardType) {
                case 'Accident':
                case 'Flooding':
                case 'Road Closure':
                    hazardPenalty += 40; // High Safety Risk
                    timeDelay += 20;     // High Delay
                    break;
                case 'Pothole':
                    hazardPenalty += 15; // Moderate Risk
                    timeDelay += 2;      // Low Delay
                    break;
                case 'Police':
                    hazardPenalty += 0;  // No Safety Risk (actually safer)
                    timeDelay += 5;      // Moderate Delay
                    break;
                case 'Traffic Jam':
                case 'Traffic':
                    hazardPenalty += 5;  // Low Safety Risk
                    timeDelay += 15;     // High Delay
                    break;
                default:
                    hazardPenalty += 10;
                    timeDelay += 5;
            }
            if (!detectedHazards.includes(h.hazardType)) detectedHazards.push(h.hazardType);
        }
      });

      // 3. Final Calculations
      let finalRiskScore = baseRiskScore + hazardPenalty;
      if (finalRiskScore > 100) finalRiskScore = 100;
      
      let finalDuration = originalTimeMins + timeDelay;

      // Determine UI Color
      let color = '#00cc66'; // Green
      if (finalRiskScore > 40) color = '#ff9933'; // Orange
      if (finalRiskScore > 75) color = '#ff4d4d'; // Red

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
            : `AI Score: ${Math.round(finalRiskScore)}/100 (Safe)`
        }
      };
    });

    // --- STEP C: Sort and Select ---

    // Fastest: Lowest Duration (ignoring risk)
    const fastest = [...analyzedRoutes].sort((a, b) => 
      parseFloat(a.summary.duration) - parseFloat(b.summary.duration)
    )[0];

    // Safest: Lowest Risk Score (ignoring time)
    const safest = [...analyzedRoutes].sort((a, b) => 
      a.safety.score - b.safety.score
    )[0];

    // --- STEP D: Return Response ---
    res.json({
        weather: weather,
        routes: {
            fastest: fastest,
            safest: safest, // Only returning these two as requested
            count: analyzedRoutes.length
        },
        recommendation: {
            shouldWait: weather.precipitation > 2.0 || safest.safety.score > 80,
            text: safest.safety.score > 80 
               ? "⚠️ HIGH RISK: Hazards detected. Recommend delaying travel." 
               : "✅ Conditions are good. Use the Safe Route."
        }
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. HAZARD REPORTING (Unchanged)
// ==========================================
router.post('/report-hazard', async (req, res) => {
  try {
    const { latitude, longitude, hazardType, description } = req.body;
    if (!latitude || !longitude || !hazardType) return res.status(400).json({ error: 'Missing fields' });
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