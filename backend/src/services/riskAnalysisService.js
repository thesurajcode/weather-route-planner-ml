// backend/src/services/riskAnalysisService.js
const axios = require('axios');

// ✅ UPDATED: Connected to your live Python ML Service
const ML_API_URL = "https://weather-route-planner-ml.onrender.com/predict"; 

const getRiskScore = async (weatherData, routeData) => {
  console.log("🤖 Connecting to Python ML Service...");

  // 1. Prepare Data for the ML Model
  
  // -- Weather --
  let weatherInput = "Clear";
  if (weatherData) {
      if (weatherData.condition.includes("Rain")) weatherInput = "Drizzle"; 
      else if (weatherData.condition.includes("Fog")) weatherInput = "Fog";
      else if (weatherData.condition.includes("Cloud")) weatherInput = "Clouds";
  }

  // -- Time of Day --
  let timeInput = "Afternoon";
  const hour = new Date().getHours();
  if (hour > 20 || hour < 5) timeInput = "Night";
  else if (hour > 5 && hour < 12) timeInput = "Morning";
  else if (hour >= 17 && hour <= 20) timeInput = "Evening";
  
  // -- Road Type --
  let roadInput = "City Street";
  if (routeData && routeData.summary && routeData.summary.distance) {
      const distanceStr = String(routeData.summary.distance); 
      const distanceKm = parseFloat(distanceStr.replace(' km', ''));
      if (distanceKm > 15) roadInput = "Highway";
  }

  try {
    // 2. Send Data to Python
    const response = await axios.post(ML_API_URL, {
        weather: weatherInput,
        road_type: roadInput,
        time_of_day: timeInput
    });

    // --- DEBUG LOG: See exactly what Python replied ---
    console.log("🐍 FULL PYTHON RESPONSE:", JSON.stringify(response.data, null, 2));

    const mlResult = response.data;

    // SAFETY CHECK: Did Python actually return a score?
    if (mlResult.risk_score === undefined) {
        throw new Error("Python API returned valid JSON but missing 'risk_score'. Check Python logs.");
    }

    // 3. Process the Result
    let score = mlResult.risk_score;
    let color = "#00cc66"; // Green (Safe)
    let message = "Safe driving conditions.";

    if (score > 40) {
        color = "#ff9933"; // Orange (Moderate)
        message = "Moderate Risk: Drive Carefully.";
    }
    if (score > 75) {
        color = "#ff4d4d"; // Red (High Risk)
        message = "⚠️ HIGH RISK WARNING";
    }

    return {
        score: score,
        color: color,
        // If confidence is missing, default to 'High'
        message: `${message} (AI Confidence: ${mlResult.confidence || 'High'})`,
        factors: [`Weather: ${weatherInput}`, `Time: ${timeInput}`, `Severity: ${mlResult.severity_prediction ?? 'N/A'}`]
    };

  } catch (error) {
    console.error("❌ ML Service Error:", error.message);
    if (error.response) {
        console.error("   Server responded with:", error.response.data);
    }
    console.log("⚠️ Using Local Fallback Logic (Simulation)...");
    
    // Fallback logic so the app never crashes
    return { score: 20, color: "#00cc66", message: "Safe (Offline Mode)", factors: ["ML Unavailable"] };
  }
};

module.exports = { getRiskScore };