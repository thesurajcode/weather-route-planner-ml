// backend/src/services/mapService.js
const axios = require('axios');

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
  try {
    let startLon, startLat, endLon, endLat;

    // Extract logic handles Array or Object inputs
    if (Array.isArray(startCoords)) { [startLon, startLat] = startCoords; } 
    else { startLon = startCoords.lng || startCoords.lon; startLat = startCoords.lat; }

    if (Array.isArray(endCoords)) { [endLon, endLat] = endCoords; } 
    else { endLon = endCoords.lng || endCoords.lon; endLat = endCoords.lat; }

    console.log(`🛣️ Fetching route alternatives...`);

    // --- CRITICAL CHANGE FOR 3 BUTTONS ---
    // Added "&alternatives=true" to get multiple paths
    const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=true`;
    
    const response = await axios.get(url);

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No route found.");
    }

    // --- CRITICAL CHANGE ---
    // Return ALL routes (Array), not just the first geometry.
    // The backend routes.js needs the whole array to calculate safety for each.
    return response.data.routes; 

  } catch (error) {
    console.error("❌ OSRM Error:", error.message);
    throw new Error('Could not fetch route from OSRM.');
  }
};

module.exports = { getRouteFromOSRM, getCoordsFromAddress };