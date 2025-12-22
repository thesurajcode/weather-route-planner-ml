import React from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import RouteLayer from './RouteLayer';
import HazardMarkers from './HazardMarkers';

// Fix for default Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const MapContainer = () => {
    const { currentRoute, startCoords } = useApp();
    const defaultCenter = [28.6139, 77.2090]; // Delhi

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <LeafletMap center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                {/* 1. Draw the Routes (Blue and Green lines) */}
                {currentRoute && <RouteLayer routes={currentRoute.routes} />}
                
                {/* 2. Show reported hazards */}
                <HazardMarkers />

                {/* 3. Start Marker */}
                {startCoords && (
                    <Marker position={startCoords.split(',').map(Number)} />
                )}
            </LeafletMap>
        </div>
    );
};

export default MapContainer;