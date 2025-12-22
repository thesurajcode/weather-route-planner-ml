import React, { useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const ReportMenu = ({ position, onClose }) => {
    const { fetchHazards } = useApp();
    const [hazardType, setHazardType] = useState('Traffic');

    const handleReport = async () => {
        try {
            await api.post('/report-hazard', {
                latitude: position.lat,
                longitude: position.lng,
                hazardType,
                description: `User reported ${hazardType} at this location.`
            });
            fetchHazards(); // Refresh icons on map
            onClose();
            alert(`Reported ${hazardType} successfully!`);
        } catch (err) {
            alert("Error reporting hazard.");
        }
    };

    return (
        <div className="report-menu">
            <h4>Report Hazard</h4>
            <select value={hazardType} onChange={(e) => setHazardType(e.target.value)}>
                <option value="Traffic">🚦 Traffic Jam</option>
                <option value="Accident">💥 Accident</option>
                <option value="Flooding">🌊 Flooding</option>
                <option value="Police">👮 Police</option>
                <option value="Pothole">🕳️ Pothole</option>
            </select>
            <button onClick={handleReport} className="submit-report-btn">Submit Report</button>
        </div>
    );
};

export default ReportMenu;