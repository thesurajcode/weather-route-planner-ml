import axios from "axios";
import { getWeatherRisk } from "./weather.js";

export async function calculateRisk(route) {
  let mlRisk = 20;

  try {
    const res = await axios.post(process.env.ML_API_URL, {
      route: route.geometry
    });
    mlRisk = res.data.risk || 20;
  } catch {
    console.log("ML service unavailable, using default risk");
  }

  const weatherRisk = await getWeatherRisk(route);

  return (
    route.distance * 0.0001 +
    weatherRisk * 0.5 +
    mlRisk * 0.5
  );
}
