import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';

const MapEffects = () => {
    const map = useMap();
    const { currentRoute } = useApp();

    useEffect(() => {
        if (currentRoute?.routes?.safest) {
            const coords = currentRoute.routes.safest.geometry.coordinates[0];
            const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [currentRoute, map]);

    return null;
};

export default MapEffects;