import React from 'react';
import { Polyline, Popup } from 'react-leaflet';

const RouteLayer = ({ routes }) => {
    if (!routes) return null;

    // Helper to flip coordinates from [lon, lat] to [lat, lon] for Leaflet
    const processCoords = (geometry) => {
        return geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
    };

    const fastestPath = processCoords(routes.fastest.geometry);
    const safestPath = processCoords(routes.safest.geometry);

    return (
        <>
            {/* 🏎️ FASTEST ROUTE - Blue Dashed Line */}
            <Polyline 
                positions={fastestPath} 
                pathOptions={{ 
                    color: '#3b82f6', 
                    weight: 4, 
                    dashArray: '10, 10', 
                    opacity: 0.6 
                }} 
            >
                <Popup>
                    <strong>Fastest Route</strong><br/>
                    Time: {routes.fastest.summary.duration}<br/>
                    Safety Score: {routes.fastest.safety.score}/100
                </Popup>
            </Polyline>

            {/* 🛡️ SAFEST ROUTE - Solid Green Line */}
            <Polyline 
                positions={safestPath} 
                pathOptions={{ 
                    color: '#10b981', 
                    weight: 7, 
                    opacity: 1 
                }} 
            >
                <Popup>
                    <strong>Safest Route (AI Optimized)</strong><br/>
                    Time: {routes.safest.summary.duration}<br/>
                    Safety Score: {routes.safest.safety.score}/100
                </Popup>
            </Polyline>
        </>
    );
};

export default RouteLayer;