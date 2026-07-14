import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const API_KEY = process.env.GEOAPIFY_API_KEY;

if (!API_KEY) {
  console.error("❌ GEOAPIFY_API_KEY not loaded in geoapify.js");
}

/**
 * Geocode place name → "lat,lon"
 */
async function geocode(place) {
  if (!place) {
    throw new Error("Place is required for geocoding");
  }

  try {
    const res = await axios.get(
      "https://api.geoapify.com/v1/geocode/search",
      {
        params: {
          text: place,
          limit: 5,
          apiKey: API_KEY
        }
      }
    );

    console.log("🔍 Geocoding:", place);
    console.log(
      "📍 Results found:",
      res.data.features?.length || 0
    );

    if (
      res.data.features &&
      res.data.features.length > 0
    ) {
      console.log(
        "✅ Top match:",
        res.data.features[0].properties.formatted
      );
    }

    if (
      !res.data.features ||
      res.data.features.length === 0
    ) {
      throw new Error(`Geocoding failed for ${place}`);
    }

    const [lon, lat] =
      res.data.features[0].geometry.coordinates;

    return `${lat},${lon}`;
  } catch (error) {
    console.error(
      `❌ Geocoding error for "${place}":`,
      error.message
    );
    throw error;
  }
}

/**
 * Get route alternatives
 */
export async function getRoutes(start, end) {
  if (!API_KEY) {
    throw new Error("GEOAPIFY_API_KEY is missing");
  }

  const startCoord = await geocode(start);
  const endCoord = await geocode(end);

  const response = await axios.get(
    "https://api.geoapify.com/v1/routing",
    {
      params: {
        waypoints: `${startCoord}|${endCoord}`,
        mode: "drive",
        alternatives: 2,
        format: "geojson",
        apiKey: API_KEY
      }
    }
  );

  const routes = response.data?.features || [];

  if (routes.length === 0) {
    throw new Error(
      "No routes returned from Geoapify"
    );
  }

  return routes.map((route, index) => {
    const coordinates =
      route.geometry.type === "MultiLineString"
        ? route.geometry.coordinates.flat()
        : route.geometry.coordinates;

    return {
      id: index,

      geometry: coordinates.map(
        ([lon, lat]) => [lat, lon]
      ),

      distance: route.properties.distance,

      duration: route.properties.time,

      riskScore: 0,

      classification: "UNKNOWN"
    };
  });
}