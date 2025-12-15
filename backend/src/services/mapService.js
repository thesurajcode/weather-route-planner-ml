// backend/src/services/mapService.js
const axios = require('axios');

// Get the key from Environment Variables
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

const getCoordsFromAddress = async (address) => {
  try {
    // 1. Handle "Lat, Lon" String Input (e.g., "28.5, 77.2")
    if (typeof address === 'string' && address.includes(',')) {
      const parts = address.split(',').map(p => parseFloat(p.trim()));
      // Check if it looks like coordinates
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        // Return [lon, lat] (GeoJSON format usually expects lon first)
        // If user typed "28.5, 77.2" (lat, lon), we return [77.2, 28.5]
        return [parts[1], parts[0]]; 
      }
    }

    // 2. Handle Direct Arrays or Objects
    if (Array.isArray(address) && address.length === 2) return [parseFloat(address[0]), parseFloat(address[1])];
    if (typeof address === 'object' && address !== null) {
      const lat = address.lat || address.latitude;
      const lon = address.lng || address.lon || address.longitude;
      return [parseFloat(lon), parseFloat(lat)];
    }

    console.log(`🔍 Searching Geoapify for: "${address}"...`);

    // 3. UPGRADE: Use Geoapify Geocoding API (Better than Photon)
    if (!GEOAPIFY_API_KEY) {
        throw new Error("Missing GEOAPIFY_API_KEY for search.");
    }

    const url = `https://api.geoapify.com/v1/geocode/search`;
    
    const response = await axios.get(url, { 
      params: { 
        text: address,
        apiKey: GEOAPIFY_API_KEY,
        limit: 1 // We only need the best match
      } 
    });

    if (!response.data || !response.data.features || response.data.features.length === 0) {
      throw new Error(`Address not found: ${address}`);
    }

    const result = response.data.features[0];
    const [lon, lat] = result.geometry.coordinates;
    
    console.log(`✅ Found: ${result.properties.formatted} (${lat}, ${lon})`);
    return [lon, lat]; 

  } catch (error) {
    console.error("⚠️ Geocoding Error:", error.message);
    // Fallback error message
    throw new Error('Could not find location. Try a more specific address.');
  }
};

const getRouteFromOSRM = async (startCoords, endCoords) => {
  // NOTE: Function name is kept as 'getRouteFromOSRM' to avoid breaking other files,
  // but it now uses Geoapify Routing.

  if (!GEOAPIFY_API_KEY) {
    throw new Error("Missing GEOAPIFY_API_KEY in environment variables.");
  }

  let startLon, startLat, endLon, endLat;

  if (Array.isArray(startCoords)) { [startLon, startLat] = startCoords; } 
  else { startLon = startCoords.lng || startCoords.lon; startLat = startCoords.lat; }

  if (Array.isArray(endCoords)) { [endLon, endLat] = endCoords; } 
  else { endLon = endCoords.lng || endCoords.lon; endLat = endCoords.lat; }

  console.log(`🛣️ Fetching route from Geoapify...`);

  try {
    const waypoints = `${startLat},${startLon}|${endLat},${endLon}`;
    const url = `https://api.geoapify.com/v1/routing`;

    const response = await axios.get(url, {
      params: {
        waypoints: waypoints,
        mode: 'drive',
        apiKey: GEOAPIFY_API_KEY,
        details: 'instruction_details',
        format: 'geojson'
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      console.log("✅ Route fetched successfully!");
      const route = response.data.features[0];
      return [{
        geometry: route.geometry,
        legs: [{
           distance: route.properties.distance,
           duration: route.properties.time,
           steps: route.properties.legs ? route.properties.legs[0].steps : []
        }]
      }];
    } else {
        throw new Error("No routes found.");
    }

  } catch (error) {
    console.error(`❌ Geoapify Error: ${error.response?.data?.message || error.message}`);
    throw new Error('Routing service failed.');
  }
};

module.exports = { getRouteFromOSRM, getCoordsFromAddress };