import React, { useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../context/AppContext';
import RouteLayer from './RouteLayer';
import HazardMarkers from './HazardMarkers';
import ReportMenu from '../Hazards/ReportMenu';

// --- CUSTOM ICONS ---
const carIcon = L.divIcon({ html: '🚗', className: 'car-icon', iconSize: [30, 30] });
const locationIcon = L.divIcon({ html: '📍', className: 'loc-icon', iconSize: [30, 30] });

const MapContainer = () => {
    const { currentRoute, isDriving, startCoords } = useApp();
    const [carPos, setCarPos] = useState(null);
    const [reportPos, setReportPos] = useState(null);

    // Click handler for reporting hazards
    const MapEvents = () => {
        useMapEvents({
            click(e) { setReportPos(e.latlng); }
        });
        return null;
    };

    // Driving Simulation Logic: Moves the car along the Safest Route
    useEffect(() => {
        if (isDriving && currentRoute?.routes?.safest) {
            const coords = currentRoute.routes.safest.geometry.coordinates[0];
            let i = 0;
            const interval = setInterval(() => {
                if (i < coords.length) {
                    setCarPos([coords[i][1], coords[i][0]]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 300); // Speed of simulation
            return () => clearInterval(interval);
        } else {
            setCarPos(null);
        }
    }, [isDriving, currentRoute]);

    return (
        <LeafletMap center={[28.6139, 77.2090]} zoom={12} className="leaflet-container">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapEvents />

            {/* User's Starting Location Symbol */}
            {startCoords && <Marker position={startCoords.split(',').map(Number)} icon={locationIcon} />}

            {/* Car Drive Symbol */}
            {carPos && <Marker position={carPos} icon={carIcon} />}

            {/* Hazard Reporting Menu */}
            {reportPos && (
                <Popup position={reportPos} onClose={() => setReportPos(null)}>
                    <ReportMenu position={reportPos} onClose={() => setReportPos(null)} />
                </Popup>
            )}

            <RouteLayer routes={currentRoute?.routes} />
            <HazardMarkers />
        </LeafletMap>
    );
};

export default MapContainer;