// backend/src/services/riskAnalysisService.js
const axios = require('axios');

// ✅ UPDATED: Connected to your live Python ML Service
const ML_API_URL = "https://weather-route-planner-ml.onrender.com/predict"; 

const getRiskScore = async (weatherData, routeData) => {
  console.log("🤖 Connecting to Python ML Service...");

  // 1. Prepare Data for the ML Model
  let weatherInput = "Clear";
  if (weatherData) {
      if (weatherData.condition.includes("Rain")) weatherInput = "Drizzle"; 
      else if (weatherData.condition.includes("Fog")) weatherInput = "Fog";
      else if (weatherData.condition.includes("Cloud")) weatherInput = "Clouds";
  }

  let timeInput = "Afternoon";
  const hour = new Date().getHours();
  if (hour > 20 || hour < 5) timeInput = "Night";
  else if (hour > 5 && hour < 12) timeInput = "Morning";
  else if (hour >= 17 && hour <= 20) timeInput = "Evening";
  
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

    // Debug Log
    console.log("🐍 FULL PYTHON RESPONSE:", JSON.stringify(response.data, null, 2));

    const mlResult = response.data;

    // ✅ FIX: Use 'estimated_risk_score' instead of 'risk_score'
    // Your Python API returns: { estimated_risk_score: 10, prediction_class: 0, severity: "Low" }
    
    // Safety Check
    if (mlResult.estimated_risk_score === undefined) {
        throw new Error("Python API missing 'estimated_risk_score'");
    }

    // 3. Process the Result
    let score = mlResult.estimated_risk_score; 
    let severity = mlResult.severity || "Low"; // Handle Severity
    
    let color = "#00cc66"; // Green (Safe)
    let message = "Safe driving conditions.";

    if (score > 40) {
        color = "#ff9933"; // Orange
        message = "Moderate Risk: Drive Carefully.";
    }
    if (score > 75) {
        color = "#ff4d4d"; // Red
        message = "⚠️ HIGH RISK WARNING";
    }

    return {
        score: score,
        color: color,
        // We removed 'confidence' since your Python log didn't show it, using Severity instead
        message: `${message} (Severity: ${severity})`,
        factors: [`Weather: ${weatherInput}`, `Time: ${timeInput}`, `Road: ${roadInput}`]
    };

  } catch (error) {
    console.error("❌ ML Service Error:", error.message);
    if (error.response) {
        console.error("   Server responded with:", error.response.data);
    }
    console.log("⚠️ Using Local Fallback Logic (Simulation)...");
    
    return { score: 20, color: "#00cc66", message: "Safe (Offline Mode)", factors: ["ML Unavailable"] };
  }
};

module.exports = { getRiskScore };