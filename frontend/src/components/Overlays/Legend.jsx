import React from 'react';

const Legend = () => {
    return (
        <div className="map-legend-overlay">
            <h4>Research Model Guide</h4>
            <div className="legend-item">
                <span className="line green-solid"></span>
                <span>Safest ($R_{safe}$): ML + Weather + Mongo</span>
            </div>
            <div className="legend-item">
                <span className="line blue-dashed"></span>
                <span>Fastest ($R_{fast}$): Geoapify Optimized</span>
            </div>
            <div className="legend-divider"></div>
            <div className="hazard-icons">
                <span>💥 Accident</span>
                <span>👮 Police</span>
                <span>🚦 Traffic</span>
            </div>
        </div>
    );
};

export default Legend;