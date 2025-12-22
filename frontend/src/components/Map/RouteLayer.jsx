import React, { useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const RouteLayer = ({ routes }) => {
    const map = useMap();

    useEffect(() => {
        if (routes?.fastest?.geometry) {
            const latLngs = routes.fastest.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            map.fitBounds(latLngs, { padding: [50, 50] });
        }
    }, [routes, map]);

    if (!routes) return null;

    // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
    const fastestCoords = routes.fastest.geometry.coordinates[0].map(c => [c[1], c[0]]);
    const safestCoords = routes.safest.geometry.coordinates[0].map(c => [c[1], c[0]]);

    return (
        <>
            {/* Fastest Route - Blue */}
            <Polyline positions={fastestCoords} pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.7 }} />
            
            {/* Safest Route - Green */}
            <Polyline positions={safestCoords} pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9 }} />
        </>
    );
};

export default RouteLayer;