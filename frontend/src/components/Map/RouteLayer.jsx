import React, { useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

const RouteLayer = ({ route }) => {
    const map = useMap();

    // 1. Convert Coordinates
    const getPositions = () => {
        if (!route?.geometry?.coordinates) return [];
        let raw = route.geometry.coordinates;
        if (Array.isArray(raw[0]) && Array.isArray(raw[0][0])) raw = raw.flat();
        return raw.filter(c => c.length >= 2).map(c => [c[1], c[0]]);
    };
    const positions = getPositions();

    // 2. Draw Arrows
    useEffect(() => {
        if (!map || positions.length === 0) return;
        try {
            const arrows = L.polylineDecorator(positions, {
                patterns: [{
                    offset: '50px',
                    repeat: '150px',
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 12,
                        polygon: false,
                        headAngle: 40,
                        pathOptions: { stroke: true, color: 'white', weight: 3, opacity: 1 }
                    })
                }]
            });
            arrows.addTo(map);
            return () => map.removeLayer(arrows);
        } catch (e) { console.error("Arrow Error", e); }
    }, [map, positions]);

    if (positions.length === 0) return null;

    return <Polyline positions={positions} color={route.safety.color || 'blue'} weight={6} />;
};

export default RouteLayer;