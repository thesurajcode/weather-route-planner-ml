// backend/src/services/riskAnalysisService.js

/**
 * Calculates a safety risk score based on weather and route data.
 * Returns a score (0-100), a color, and a list of risk factors.
 */
const getRiskScore = async (weatherData, routeData) => {
  console.log("🤖 AI Analyzing Risk (Local Mode)...");
  
  // 1. Base Score (Start with safe conditions)
  let score = 10; 
  let factors = [];
  let message = "Safe driving conditions.";
  let color = "#00cc66"; // Green

  try {
    // 2. Weather Analysis
    if (weatherData) {
        // Rain
        if (weatherData.condition.includes("Rain")) {
            score += 35;
            factors.push("Wet Roads");
            message = "Caution: Slippery roads.";
        }
        // Storm
        if (weatherData.condition.includes("Storm") || weatherData.condition.includes("Thunder")) {
            score += 55;
            factors.push("Stormy Conditions");
            message = "Danger: High winds and rain.";
        }
        // Fog / Visibility
        if (weatherData.condition.includes("Fog") || weatherData.condition.includes("Mist")) {
            score += 40;
            factors.push("Low Visibility");
        }
        // Air Quality
        if (weatherData.aqi > 3) {
            score += 20;
            factors.push("Poor Air Quality");
        }
    }

    // 3. Route Analysis (Long drives are riskier)
    const distanceKm = (routeData && routeData.summary && routeData.summary.distance) 
        ? parseFloat(routeData.summary.distance) 
        : 0;
        
    if (distanceKm > 50) {
        score += 10;
        factors.push("Long Distance");
    }

    // 4. Time of Day (Night driving)
    const hour = new Date().getHours();
    if (hour > 22 || hour < 5) {
        score += 25;
        factors.push("Night Driving");
        message = "Reduced visibility due to night time.";
    }

    // 5. Cap score at 100
    if (score > 100) score = 100;

    // 6. Determine Final Color
    if (score > 40) color = "#ff9933"; // Orange (Moderate)
    if (score > 75) color = "#ff4d4d"; // Red (High Risk)

    return {
        score: score,
        color: color,
        message: message,
        factors: factors
    };

  } catch (error) {
    console.error("Risk Analysis Error:", error);
    // Safe fallback so app doesn't crash
    return { score: 10, color: "#00cc66", message: "Safe", factors: [] };
  }
};

module.exports = { getRiskScore };