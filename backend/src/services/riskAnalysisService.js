// backend/src/services/riskAnalysisService.js
const axios = require('axios');

// ✅ UPDATED: Connected to your live Python ML Service
// This URL points to your deployed Python model on Render
const ML_API_URL = "https://weather-route-planner-ml.onrender.com/predict"; 

const getRiskScore = async (weatherData, routeData) => {
  console.log("🤖 Connecting to Python ML Service...");

  // 1. Prepare Data for the ML Model
  // We map the real-world data to the inputs your model was trained on
  
  // -- Weather --
  // Maps Open-Meteo descriptions to your CSV labels (Drizzle, Fog, etc.)
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
  // We estimate the road type based on the trip distance (longer = Highway)
  let roadInput = "City Street";
  if (routeData && routeData.summary && routeData.summary.distance) {
      // Clean up the string (e.g., "15 km" -> 15.0)
      const distanceStr = String(routeData.summary.distance); 
      const distanceKm = parseFloat(distanceStr.replace(' km', ''));
      if (distanceKm > 15) roadInput = "Highway";
  }

  try {
    // 2. Send Data to Python
    // We send a POST request to your running ML API
    const response = await axios.post(ML_API_URL, {
        weather: weatherInput,
        road_type: roadInput,
        time_of_day: timeInput
    });

    const mlResult = response.data;
    console.log(`✅ ML Prediction Received: Score ${mlResult.risk_score}`);

    // 3. Process the Result for the Frontend
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
        // Shows confidence level from your XGBoost model
        message: `${message} (AI Confidence: ${mlResult.confidence || 'High'})`,
        factors: [`Weather: ${weatherInput}`, `Time: ${timeInput}`, `Severity Level: ${mlResult.severity_prediction}`]
    };

  } catch (error) {
    console.error("❌ Failed to contact Python ML Server:", error.message);
    console.log("⚠️ Using Local Fallback Logic...");
    
    // Fallback logic so the app never crashes if the Python server is asleep
    return { score: 20, color: "#00cc66", message: "Safe (Offline Mode)", factors: ["ML Unavailable"] };
  }
};

module.exports = { getRiskScore };