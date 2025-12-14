// backend/src/services/mapService.js
const axios = require('axios');

// Get the key from Environment Variables
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

const getCoordsFromAddress = async (address) => {
  try {
    // 1. Handle "Lat, Lon" String Input
    if (typeof address === 'string' && address.includes(',')) {
      const parts = address.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[1], parts[0]]; 
      }
    }

    // 2. Handle Array [lon, lat]
    if (Array.isArray(address) && address.length === 2) {
      return [parseFloat(address[0]), parseFloat(address[1])];
    }
    
    // 3. Handle Object { lat, lng }
    if (typeof address === 'object' && address !== null && (address.lat || address.latitude)) {
      const lat = address.lat || address.latitude;
      const lon = address.lng || address.lon || address.longitude;
      return [parseFloat(lon), parseFloat(lat)];
    }

    console.log(`🔍 Geocoding (Photon): "${address}"...`);

    // 4. Call Photon API
    const url = `https://photon.komoot.io/api/`;
    const response = await axios.get(url, { params: { q: address, limit: 1 } });

    if (!response.data || !response.data.features || response.data.features.length === 0) {
      throw new Error(`Address not found: ${address}`);
    }

    const result = response.data.features[0];
    const [lon, lat] = result.geometry.coordinates;
    return [lon, lat]; 

  } catch (error) {
    console.error("⚠️ Geocoding Error:", error.message);
    throw new Error('Could not find coordinates.');
  }
};

const getRouteFromOSRM = async (startCoords, endCoords) => {
  // NOTE: Function name is kept as 'getRouteFromOSRM' to avoid breaking other files,
  // but it now uses Geoapify.

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
    // Geoapify Routing API
    // Format: waypoints=lat1,lon1|lat2,lon2
    const waypoints = `${startLat},${startLon}|${endLat},${endLon}`;
    const url = `https://api.geoapify.com/v1/routing`;

    const response = await axios.get(url, {
      params: {
        waypoints: waypoints,
        mode: 'drive',
        apiKey: GEOAPIFY_API_KEY,
        details: 'instruction_details', // Request steps
        format: 'geojson'
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      console.log("✅ Route fetched successfully from Geoapify!");
      
      const route = response.data.features[0];
      
      // Transform Geoapify response to match OSRM structure for frontend
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
    throw new Error('Routing service failed. Please check server logs.');
  }
};

module.exports = { getRouteFromOSRM, getCoordsFromAddress };