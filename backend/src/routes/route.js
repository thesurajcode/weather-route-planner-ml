import express from "express"; 
import { getRoutes } from "../services/geoapify.js";
import { getWeatherAndAQI } from "../services/weather.js";
import { getRiskFromML } from "../services/ml.js"; 
import { getHazardPenalty } from "../services/hazardScore.js";
import { getZonePenalty } from "../services/zoneScore.js"; // 🏛 DTP ZONES

const router = express.Router();

/**
 * ✅ Health check
 */
router.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Route API working" });
});

/**
 * ✅ Main route
 * GET /api/routes?start=IIT Delhi&end=Connaught Place Delhi&mode=safe
 */
router.get("/", async (req, res) => {
  try {
    const { start, end, mode = "fast" } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: "start and end query parameters are required"
      });
    }

    console.log("📍 Route request:", { start, end, mode });

    // 1️⃣ Get routes
    const routes = await getRoutes(start, end);

    // 2️⃣ Process each route
    for (const route of routes) {
      const midIndex = Math.floor(route.geometry.length / 2);
      const [lat, lon] = route.geometry[midIndex];

      // 🌦 Weather + AQI
      const weather = await getWeatherAndAQI(lat, lon);
      route.weather = weather.ui;
      route.mlWeather = weather.ml;

      /* =====================================================
         🚀 FAST MODE → BASELINE SAFETY SCORE (NO ML / NO ZONES)
      ===================================================== */
      if (mode === "fast") {
        const aqi = route.weather.aqi;

        const aqiPenalty =
          aqi > 300 ? 30 :
          aqi > 200 ? 25 :
          aqi > 150 ? 20 :
          aqi > 100 ? 10 : 0;

        const visibilityPenalty =
          route.weather.condition === "Fog" ? 20 :
          route.weather.condition === "Haze" ? 10 : 0;

        const rainPenalty =
          route.mlWeather.rainfall > 2 ? 10 : 0;

        const windPenalty =
          route.weather.wind > 10 ? 10 : 0;

        const fastRisk = Math.min(
          100,
          aqiPenalty +
          visibilityPenalty +
          rainPenalty +
          windPenalty
        );

        route.riskScore = Number(fastRisk.toFixed(1));
        route.classification = "BASELINE_FAST";

        // 🔍 Debug (used for CSV & comparison)
        route.debug = {
          aqiPenalty,
          visibilityPenalty,
          rainPenalty,
          windPenalty
        };

        continue;
      }

      /* =====================================================
         🛡 SAFE MODE → ML + WEATHER + HAZARDS + DTP ZONES
      ===================================================== */
      try {
        /* 🧠 1️⃣ ML risk */
        const mlResponse = await getRiskFromML({
          weather: route.weather.condition,
          road_type: "City",
          surface: route.weather.rain ? "Wet" : "Dry"
        });

        const mlRisk = mlResponse.estimated_risk_score;
        const weightedML = 0.6 * mlRisk;

        /* 🌫 2️⃣ AQI penalty */
        const aqi = route.weather.aqi;
        const aqiPenalty =
          aqi > 300 ? 30 :
          aqi > 200 ? 25 :
          aqi > 150 ? 20 :
          aqi > 100 ? 10 : 0;

        /* 👁 3️⃣ Visibility penalty */
        const visibilityPenalty =
          route.weather.condition === "Fog" ? 20 :
          route.weather.condition === "Haze" ? 10 : 0;

        /* 🌧 4️⃣ Rain penalty */
        const rainPenalty =
          route.mlWeather.rainfall > 10 ? 20 :
          route.mlWeather.rainfall > 2 ? 10 : 0;

        /* 🌬 5️⃣ Wind penalty */
        const windPenalty =
          route.weather.wind > 10 ? 10 : 0;

        /* 🚧 6️⃣ User-reported hazard penalty */
        const hazardResult = await getHazardPenalty(route.geometry);

        const hazardPenalty =
          typeof hazardResult === "number"
            ? hazardResult
            : hazardResult.penalty;

        const hazardCount =
          typeof hazardResult === "object"
            ? hazardResult.count
            : null;

        /* 🏛 7️⃣ Official DTP crash-prone zone penalty */
        const zoneResult = getZonePenalty(route.geometry);
        const zonePenalty = zoneResult.penalty;
        const zoneCount = zoneResult.count;

        /* 🔥 FINAL SAFE RISK SCORE */
        const finalRisk = Math.min(
          100,
          weightedML +
          aqiPenalty +
          visibilityPenalty +
          rainPenalty +
          windPenalty +
          hazardPenalty +
          zonePenalty
        );

        route.riskScore = Number(finalRisk.toFixed(1));

        route.classification =
          finalRisk > 70 ? "High" :
          finalRisk > 40 ? "Medium" :
          "Low";

        /* 🧪 DEBUG DATA (RESEARCH GOLD) */
        route.debug = {
          mlRisk,
          weightedML,
          aqiPenalty,
          visibilityPenalty,
          rainPenalty,
          windPenalty,
          hazardPenalty,
          hazardCount,
          zonePenalty,
          zoneCount
        };

        console.log(
          `🚧 Hazard usage → penalty=${hazardPenalty}, count=${hazardCount}`
        );
        console.log(
          `🏛 Zone usage → penalty=${zonePenalty}, count=${zoneCount}`
        );

      } catch (error) {
        console.warn("⚠️ SAFE fallback used:", error.message);

        route.riskScore = route.weather.aqi > 150 ? 80 : 40;
        route.classification = "RISKY";
      }
    }

    // 3️⃣ Sort SAFE routes by lowest risk
    if (mode === "safe") {
      routes.sort((a, b) => (a.riskScore ?? 999) - (b.riskScore ?? 999));
    }

    // 4️⃣ Response
    res.status(200).json({
      success: true,
      mode,
      count: routes.length,
      routes
    });

  } catch (error) {
    console.error("❌ Route error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
