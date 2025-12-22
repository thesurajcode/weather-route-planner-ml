import React from 'react';
import { useApp } from '../../context/AppContext';

const Recommendation = () => {
    const { currentRoute } = useApp();
    if (!currentRoute) return null;

    const { safest } = currentRoute.routes;

    return (
        <div className="recommendation-panel">
            <div className="safety-badge">
                AI Safety Score: <strong>{safest.safety.score}/100</strong>
            </div>
            <p className="ai-text">{currentRoute.recommendation.text}</p>
            <div className="guide-stats">
                <span>🌬️ AQI: 142 (Fair)</span>
                <span>🛣️ Safe Speed: 45 km/h</span>
            </div>
        </div>
    );
};

export default Recommendation;