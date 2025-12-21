import api from './api';

export const fetchRoute = async (start, end) => {
    try {
        const response = await api.post('/route', { start, end });
        return response.data;
    } catch (error) {
        console.error("Route Fetch Error:", error);
        throw error;
    }
};

export const reverseGeocode = async (lat, lon) => {
    try {
        // Using Photon for free reverse geocoding
        const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data.features.length > 0) {
            const p = data.features[0].properties;
            return [p.name, p.city].filter(Boolean).join(", ");
        }
        return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch (error) {
        return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
};