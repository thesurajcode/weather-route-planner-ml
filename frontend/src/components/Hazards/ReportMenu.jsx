import React, { useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const ReportMenu = ({ position, onClose }) => {
    const { setHazards } = useApp();
    const [type, setType] = useState('Traffic');

    const submitReport = async () => {
        try {
            await api.post('/report-hazard', {
                latitude: position.lat,
                longitude: position.lng,
                hazardType: type,
                description: `User reported ${type}`
            });
            
            // Refresh hazards list
            const res = await api.get('/hazards');
            setHazards(res.data);
            onClose();
            alert("Hazard reported successfully!");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="report-popup" style={{ padding: '10px' }}>
            <h4>Report Issue</h4>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                <option>Traffic</option>
                <option>Accident</option>
                <option>Flooding</option>
                <option>Pothole</option>
            </select>
            <button onClick={submitReport} style={{ marginTop: '10px', width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '5px' }}>
                Submit
            </button>
        </div>
    );
};

export default ReportMenu;