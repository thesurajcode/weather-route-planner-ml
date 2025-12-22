const axios = require('axios');
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

const getCoordsFromAddress = async (address) => {
  try {
    if (typeof address === 'string' && address.includes(',')) {
      const parts = address.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[1], parts[0]]; 
      }
    }

    const url = `https://api.geoapify.com/v1/geocode/search`;
    const response = await axios.get(url, { 
      params: { text: address, apiKey: GEOAPIFY_API_KEY, limit: 1 } 
    });

    if (!response.data?.features?.length) throw new Error(`Address not found: ${address}`);

    const result = response.data.features[0];
    return result.geometry.coordinates; // [lon, lat]
  } catch (error) {
    throw new Error('Could not find location. Try a more specific address.');
  }
};

const getRouteFromOSRM = async (startCoords, endCoords) => {
  try {
    const [startLon, startLat] = Array.isArray(startCoords) ? startCoords : [startCoords.lon, startCoords.lat];
    const [endLon, endLat] = Array.isArray(endCoords) ? endCoords : [endCoords.lon, endCoords.lat];

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

    if (response.data.features?.length > 0) {
      const route = response.data.features[0];
      return [{
        geometry: route.geometry,
        legs: [{
           distance: route.properties.distance,
           duration: route.properties.time,
           steps: route.properties.legs ? route.properties.legs[0].steps : []
        }]
      }];
    }
    throw new Error("No routes found.");
  } catch (error) {
    throw new Error('Routing service failed.');
  }
};

module.exports = { getRouteFromOSRM, getCoordsFromAddress };