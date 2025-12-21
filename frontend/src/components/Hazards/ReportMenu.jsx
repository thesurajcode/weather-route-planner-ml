import React from 'react';
import { useLocation } from '../../context/LocationContext';
import { reportHazard } from '../../services/hazardService';

const ReportMenu = ({ onClose }) => {
    const { currentLocation } = useLocation();

    const handleReport = async (type) => {
        if (!currentLocation) return alert("Waiting for GPS...");
        const success = await reportHazard(type, currentLocation[0], currentLocation[1]);
        if (success) {
            alert(`Reported ${type}`);
            onClose();
        } else {
            alert("Failed to report");
        }
    };

    return (
        <div className="report-menu">
            <h4>Report Hazard</h4>
            <button onClick={() => handleReport('Pothole')}>🕳️ Pothole</button>
            <button onClick={() => handleReport('Accident')}>💥 Accident</button>
            <button onClick={() => handleReport('Police')}>👮 Police</button>
            <button onClick={() => handleReport('Traffic')}>🚦 Traffic</button>
            <button className="cancel" onClick={onClose}>Cancel</button>
        </div>
    );
};

export default ReportMenu;