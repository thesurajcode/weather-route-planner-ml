import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sub-components
import RouteLayer from './RouteLayer';
import HazardMarkers from './HazardMarkers';
import { FitBounds, RecenterMap } from './MapEffects';
import { useApp } from '../../context/AppContext';
import { useLocation } from '../../context/LocationContext';

// --- ICONS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const carIcon = L.divIcon({ html: '<div style="font-size: 30px;">🚗</div>', className: 'car-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
const startIcon = L.divIcon({ html: '<div style="font-size: 30px;">📍</div>', className: 'start-icon', iconSize: [30, 30], iconAnchor: [15, 30] });
const destIcon = L.divIcon({ html: '<div style="font-size: 30px;">🏁</div>', className: 'dest-icon', iconSize: [30, 30], iconAnchor: [5, 30] });

const MapContainer = () => {
    const { currentRoute, hazards, isNavigating, startCoords } = useApp();
    const { currentLocation } = useLocation();

    // Default Center (Delhi)
    const defaultCenter = [28.6139, 77.2090];

    // Helper to get Start/End points from route
    const getEndpoints = () => {
        if (!currentRoute?.geometry?.coordinates) return { start: null, end: null };
        const raw = currentRoute.geometry.coordinates.flat(Infinity);
        // Assuming [lon, lat] format from backend
        const start = [raw[1], raw[0]];
        const end = [raw[raw.length - 1], raw[raw.length - 2]];
        return { start, end };
    };
    const { start, end } = getEndpoints();

    return (
        <div className="map-wrapper" style={{ height: '100%', width: '100%' }}>
            <LeafletMap center={defaultCenter} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {/* 1. Layers */}
                {currentRoute && <RouteLayer route={currentRoute} />}
                <HazardMarkers hazards={hazards} />

                {/* 2. Markers */}
                {/* Use explicit startCoords if available, else route start */}
                {(startCoords || start) && (
                    <Marker position={startCoords ? startCoords.split(',').map(Number) : start} icon={startIcon} />
                )}
                {end && <Marker position={end} icon={destIcon} />}
                
                {/* 3. My Location (Car) */}
                {isNavigating && currentLocation && (
                    <Marker position={currentLocation} icon={carIcon} zIndexOffset={1000}>
                        <Popup>You</Popup>
                    </Marker>
                )}

                {/* 4. Effects */}
                {currentRoute && <FitBounds route={currentRoute} />}
                {isNavigating && currentLocation && <RecenterMap position={currentLocation} />}
            </LeafletMap>
        </div>
    );
};

export default MapContainer;