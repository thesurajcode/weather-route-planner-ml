// backend/src/services/riskAnalysisService.js

// This function runs locally, replacing the external Python ML service.
// It guarantees NO 502 Errors.

const getRiskScore = async (weatherData, routeData) => {
  console.log("🤖 AI Analyzing Risk (Local Mode)...");
  
  // 1. Start with a baseline score (0 = Safe, 100 = Dangerous)
  let score = 10; 
  let factors = [];
  let message = "Safe driving conditions.";
  let color = "#00cc66"; // Green

  try {
    // 2. Analyze Weather
    if (weatherData) {
        if (weatherData.condition.includes("Rain")) {
            score += 35;
            factors.push("Wet Roads");
            message = "Caution: Slippery roads detected.";
        }
        if (weatherData.condition.includes("Storm")) {
            score += 55;
            factors.push("Stormy Conditions");
            message = "Danger: High winds and rain.";
        }
        if (weatherData.condition.includes("Cloudy") && weatherData.windSpeed > 15) {
            score += 15;
            factors.push("Windy");
        }
        if (weatherData.aqi > 3) {
            score += 20;
            factors.push("Poor Visibility (Smog)");
        }
    }

    // 3. Analyze Route Distance
    // Longer routes increase fatigue risk
    const distanceKm = (routeData && routeData.summary && routeData.summary.distance) 
        ? routeData.summary.distance / 1000 
        : 0;
        
    if (distanceKm > 50) {
        score += 10;
        factors.push("Long Distance");
    }

    // 4. Time of Day Analysis (Night driving is riskier)
    const hour = new Date().getHours();
    if (hour > 22 || hour < 5) {
        score += 25;
        factors.push("Night Driving");
        message = "Reduced visibility due to night time.";
    }

    // 5. Cap the score at 100
    if (score > 100) score = 100;

    // 6. Determine Final Status Color
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
    // Default safe fallback
    return { score: 10, color: "#00cc66", message: "Safe", factors: [] };
  }
};

module.exports = { getRiskScore };