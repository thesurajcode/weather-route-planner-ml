import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const RouteLayer = ({ route }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !route) return;

        // Clear existing layers to avoid duplicates
        map.eachLayer((layer) => {
            if (layer.options && layer.options.isRouteLayer) {
                map.removeLayer(layer);
            }
        });

        // 1. Check if we have the "Fastest vs Safest" structure
        // The backend sends: { routes: { fastest: {...}, safest: {...} } }
        // Depending on how you stored it in AppContext, 'route' might be the whole object or just one.
        
        let routesToDraw = [];

        // CASE A: The prop contains the full backend response
        if (route.routes && route.routes.fastest) {
            routesToDraw.push({ data: route.routes.fastest, color: '#3b82f6', style: 'solid' }); // Blue (Fastest)
            routesToDraw.push({ data: route.routes.safest, color: '#10b981', style: 'dashed' }); // Green (Safest)
        } 
        // CASE B: The prop is just a single route object (e.g. user clicked "Select Safe Route")
        else if (route.geometry) {
            routesToDraw.push({ data: route, color: '#3b82f6', style: 'solid' });
        }

        // 2. Draw the Lines
        const bounds = L.latLngBounds([]);

        routesToDraw.forEach((item) => {
            if (!item.data.geometry) return;

            const layer = L.geoJSON(item.data.geometry, {
                style: {
                    color: item.color,
                    weight: 6,
                    opacity: 0.8,
                    dashArray: item.style === 'dashed' ? '10, 10' : null
                },
                isRouteLayer: true // Tag to help us remove it later
            }).addTo(map);

            // Extend bounds so the map zooms to fit all routes
            bounds.extend(layer.getBounds());
        });

        // 3. Zoom Map to Fit
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }

    }, [map, route]);

    return null;
};

export default RouteLayer;