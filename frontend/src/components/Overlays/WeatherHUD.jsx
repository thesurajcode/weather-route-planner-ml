import React from 'react';
import { useApp } from '../../context/AppContext';

const WeatherHUD = () => {
    const { routeData, selectedRoute } = useApp();
    
    // Hide if no route is loaded yet
    if (!routeData || !routeData.weather || !selectedRoute) return null;

    const { weather } = routeData;
    const { safety } = selectedRoute;

    // Logic: Calculate Safe Speed
    const calculateSafeSpeed = (riskScore) => {
        let baseSpeed = 50; // City
        if (selectedRoute.summary.distance.includes("km")) {
            const dist = parseFloat(selectedRoute.summary.distance);
            if (dist > 15) baseSpeed = 80; // Highway
        }
        // Reduce speed if risk is high
        const reduction = (riskScore / 10) * 0.05; 
        return Math.round(baseSpeed * (1 - reduction));
    };

    const safeSpeed = calculateSafeSpeed(safety.score);

    return (
        <div className="hud-container">
            {/* Header */}
            <div className="hud-header" style={{ borderBottom: `3px solid ${safety.color}` }}>
                <div className="risk-badge" style={{ backgroundColor: safety.color }}>
                    {Math.round(safety.score)}% RISK
                </div>
                <span style={{fontSize: '13px', fontWeight: 'bold'}}>{safety.message}</span>
            </div>

            {/* Grid */}
            <div className="hud-grid">
                {/* Safe Speed */}
                <div className="hud-item speed-box">
                    <span className="label">SAFE SPEED</span>
                    <div className="value-large">
                        {safeSpeed} <span className="unit">km/h</span>
                    </div>
                </div>

                {/* Weather */}
                <div className="hud-details">
                    <div className="detail-row">
                        <span>🌡️ Temp</span> <strong>{weather.temperature}°C</strong>
                    </div>
                    <div className="detail-row">
                        <span>💨 Wind</span> <strong>{weather.wind_speed || 12} km/h</strong>
                    </div>
                    <div className="detail-row">
                        <span>🌫️ AQI</span> <strong>{weather.aqi}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherHUD;