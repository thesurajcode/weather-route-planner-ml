import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sub-components
import RouteLayer from './RouteLayer';
import HazardMarkers from './HazardMarkers';
import { useApp } from '../../context/AppContext';
import { useLocation } from '../../context/LocationContext'; // If you use this for live tracking

// --- ICONS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const carIcon = L.divIcon({ html: '<div style="font-size: 30px;">🚗</div>', className: 'car-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
const startIcon = L.divIcon({ html: '<div style="font-size: 30px;">📍</div>', className: 'start-icon', iconSize: [30, 30], iconAnchor: [15, 30] });
const destIcon = L.divIcon({ html: '<div style="font-size: 30px;">🏁</div>', className: 'dest-icon', iconSize: [30, 30], iconAnchor: [5, 30] });

// --- HELPER COMPONENT: Auto-Zoom to Route ---
const FitBounds = ({ route }) => {
    const map = useMap();
    useEffect(() => {
        if (!route || !map) return;

        // 1. Determine which geometry to use (Fastest or Safest)
        // The backend sends: { routes: { fastest: {...}, safest: {...} } }
        let geometry = null;
        if (route.routes && route.routes.fastest) {
            geometry = route.routes.fastest.geometry;
        } else if (route.geometry) {
            geometry = route.geometry;
        }

        if (geometry) {
            const layer = L.geoJSON(geometry);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [route, map]);
    return null;
};

const MapContainer = () => {
    const { currentRoute, hazards, isNavigating, startCoords } = useApp();
    const { currentLocation } = useLocation ? useLocation() : { currentLocation: null };

    // Default Center (Delhi) - Used only if no location
    const defaultCenter = [28.6139, 77.2090];

    // --- HELPER: Extract Start/End Points from the New Data Structure ---
    const getEndpoints = () => {
        // If no route loaded yet
        if (!currentRoute) return { start: null, end: null };

        // Handle New "Hybrid" Structure
        let activeRoute = null;
        if (currentRoute.routes && currentRoute.routes.fastest) {
            activeRoute = currentRoute.routes.fastest;
        } else {
            activeRoute = currentRoute; // Fallback for old structure
        }

        if (!activeRoute?.geometry?.coordinates) return { start: null, end: null };

        // Flatten coordinates to find first and last point
        const raw = activeRoute.geometry.coordinates.flat(Infinity);
        // GeoJSON is [Lon, Lat], Leaflet needs [Lat, Lon]
        const start = [raw[1], raw[0]];
        const end = [raw[raw.length - 1], raw[raw.length - 2]];
        
        return { start, end };
    };

    const { start, end } = getEndpoints();

    // Use current location or default for initial center
    const initialCenter = startCoords 
        ? startCoords.split(',').map(Number) 
        : (currentLocation || defaultCenter);

    return (
        <div className="map-wrapper" style={{ height: '100%', width: '100%' }}>
            <LeafletMap center={initialCenter} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {/* 1. Draw Lines (Blue & Green) */}
                {currentRoute && <RouteLayer route={currentRoute} />}
                
                {/* 2. Hazard Icons */}
                <HazardMarkers hazards={hazards} />

                {/* 3. Start/End Markers */}
                {/* Priority: Explicit Start Coords > Route Start Point */}
                {(startCoords || start) && (
                    <Marker 
                        position={startCoords ? startCoords.split(',').map(Number) : start} 
                        icon={startIcon} 
                    />
                )}
                {end && <Marker position={end} icon={destIcon} />}
                
                {/* 4. Live User Location */}
                {isNavigating && currentLocation && (
                    <Marker position={currentLocation} icon={carIcon} zIndexOffset={1000}>
                        <Popup>You</Popup>
                    </Marker>
                )}

                {/* 5. Auto-Zoom Effect */}
                {currentRoute && <FitBounds route={currentRoute} />}
            </LeafletMap>
        </div>
    );
};

export default MapContainer;