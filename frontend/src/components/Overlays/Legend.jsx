import React from 'react';
import { useApp } from '../../context/AppContext';

const Legend = () => {
    const { currentRoute } = useApp();
    
    return (
        <div className="map-legend-overlay">
            <h4>Route Metrics</h4>
            <div className="legend-item">
                {/* ✅ CORRECT: Quotes around "line safe" */}
                <span className="line safe"></span> 
                Safest: {currentRoute?.routes?.safest?.safety?.score || '--'}/100
            </div>
            <div className="legend-item">
                <span className="line fast"></span> 
                Fastest: {currentRoute?.routes?.fastest?.safety?.score || '--'}/100
            </div>
            <hr />
            <div className="hazard-icons">
                <span>💥 Accident</span>
                <span>👮 Police</span>
                <span>🚦 Traffic</span>
            </div>
        </div>
    );
};

export default Legend;