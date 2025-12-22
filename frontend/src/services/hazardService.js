import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';

// --- Hazard Icon Factory ---
const getHazardIcon = (type) => {
    let emoji = '⚠️';
    if (type === 'Accident') emoji = '💥';
    if (type === 'Police') emoji = '👮';
    if (type === 'Traffic Jam' || type === 'Traffic') emoji = '🚦';
    if (type === 'Flooding') emoji = '🌊';

    return L.divIcon({
        html: `<div class="hazard-marker">${emoji}</div>`,
        className: 'custom-hazard',
        iconSize: [30, 30]
    });
};

const HazardMarkers = () => {
    const { hazards } = useApp();

    return (
        <>
            {hazards.map((hazard) => (
                <Marker 
                    key={hazard._id} 
                    position={[hazard.latitude, hazard.longitude]}
                    icon={getHazardIcon(hazard.hazardType)}
                >
                    <Popup>
                        <strong>{hazard.hazardType}</strong><br/>
                        {hazard.description || 'Reported by user'}<br/>
                        <small>{new Date(hazard.reportedAt).toLocaleString()}</small>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default HazardMarkers;