import React from 'react';
import { useApp } from '../../context/AppContext';

const SpeedLimit = () => {
    const { currentRoute } = useApp();
    if (!currentRoute) return null;

    const { score } = currentRoute.routes.safest.safety;
    const { precipitation } = currentRoute.weather;

    // AI logic for speed recommendation based on risk
    const getSafeSpeed = () => {
        let baseSpeed = 60; // Standard city speed
        if (score > 50) baseSpeed -= 15;
        if (score > 75) baseSpeed -= 25;
        if (precipitation > 1.0) baseSpeed -= 10;
        return Math.max(20, baseSpeed);
    };

    return (
        <div className="speed-limit-overlay">
            <div className="speed-circle">
                <span className="speed-value">{getSafeSpeed()}</span>
                <span className="speed-unit">km/h</span>
            </div>
            <p>AI Recommended Safe Speed</p>
        </div>
    );
};

export default SpeedLimit;