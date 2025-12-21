import React from 'react';
import { useApp } from '../../context/AppContext';

const SpeedLimit = () => {
    const { isNavigating, selectedRoute } = useApp();
    if (!isNavigating || !selectedRoute) return null;

    // Logic: Reduce speed based on Risk Score
    const calculateSafeSpeed = (riskScore) => {
        let baseSpeed = 50; // City default
        // Simple logic: higher risk = lower speed
        const reduction = (riskScore / 10) * 0.05; 
        return Math.round(baseSpeed * (1 - reduction));
    };

    const speed = calculateSafeSpeed(selectedRoute.safety.score);

    return (
        <div className="speed-limit-sign" title="AI Recommended Safe Speed">
            <div className="label">SAFE</div>
            <div className="speed">{speed}</div>
            <div className="unit">km/h</div>
        </div>
    );
};

export default SpeedLimit;