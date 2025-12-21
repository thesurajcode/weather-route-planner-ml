import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sub-components (These are in the same folder, so './' is still correct)
import RouteLayer from './RouteLayer';
import HazardMarkers from './HazardMarkers';

// ✅ FIX: Go up TWO levels to find context
import { useApp } from '../../context/AppContext';
// If you use LocationContext, fix it here too:
// import { useLocation } from '../../context/LocationContext'; 

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
        
        // Handle "Fastest/Safest" structure
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
    
    // Default Center (Delhi)
    const defaultCenter = [28.6139, 77.2090];
    
    // Parse Start/End
    const getEndpoints = () => {
        if (!currentRoute) return { start: null, end: null };

        let activeRoute = currentRoute.routes?.fastest || currentRoute;
        if (!activeRoute?.geometry?.coordinates) return { start: null, end: null };

        const raw = activeRoute.geometry.coordinates.flat(Infinity);
        const start = [raw[1], raw[0]];
        const end = [raw[raw.length - 1], raw[raw.length - 2]];
        return { start, end };
    };

    const { start, end } = getEndpoints();
    const initialCenter = startCoords ? startCoords.split(',').map(Number) : defaultCenter;

    return (
        <div className="map-wrapper" style={{ height: '100%', width: '100%' }}>
            <LeafletMap center={initialCenter} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />
                {currentRoute && <RouteLayer route={currentRoute} />}
                <HazardMarkers hazards={hazards} />
                
                {(startCoords || start) && (
                    <Marker position={startCoords ? startCoords.split(',').map(Number) : start} icon={startIcon} />
                )}
                {end && <Marker position={end} icon={destIcon} />}
                
                {currentRoute && <FitBounds route={currentRoute} />}
            </LeafletMap>
        </div>
    );
};

export default MapContainer;