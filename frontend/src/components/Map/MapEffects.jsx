import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export const FitBounds = ({ route }) => {
    const map = useMap();
    useEffect(() => {
        if (!route?.geometry?.coordinates) return;
        try {
            const rawCoords = route.geometry.coordinates.flat(Infinity);
            const latLngs = [];
            for (let i = 0; i < rawCoords.length; i += 2) {
                latLngs.push([rawCoords[i + 1], rawCoords[i]]);
            }
            if (latLngs.length > 0) {
                const bounds = L.latLngBounds(latLngs);
                map.fitBounds(bounds, { padding: [80, 80], animate: true });
            }
        } catch (e) { console.error("Zoom Error:", e); }
    }, [route, map]);
    return null;
};

export const RecenterMap = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 16);
    }, [position, map]);
    return null;
};