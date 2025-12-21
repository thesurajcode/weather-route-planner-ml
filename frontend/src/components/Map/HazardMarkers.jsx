import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const hazardIcon = L.divIcon({
    html: '<div style="font-size: 25px; line-height: 1;">⚠️</div>',
    className: 'custom-icon',
    iconSize: [25, 25],
    iconAnchor: [12, 12]
});

const HazardMarkers = ({ hazards }) => {
    return (
        <>
            {hazards.map((h, i) => (
                <Marker key={i} position={[h.latitude, h.longitude]} icon={hazardIcon}>
                    <Popup>
                        <strong>⚠️ {h.hazardType}</strong><br />
                        <small>{new Date(h.reportedAt).toLocaleTimeString()}</small>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default HazardMarkers;