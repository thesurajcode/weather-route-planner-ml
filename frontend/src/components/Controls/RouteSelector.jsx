import React from 'react';
import { useApp } from '../../context/AppContext';

const RouteSelector = () => {
    const { routeData, selectedRoute, setSelectedRoute } = useApp();
    
    // Only show if we actually have route data
    if (!routeData || !routeData.routes) return null;

    const { safest, fastest } = routeData.routes;

    return (
        <div className="filter-row">
            <button 
                className={`filter-btn safe ${selectedRoute === safest ? 'active' : ''}`} 
                onClick={() => setSelectedRoute(safest)}
            >
                {/* 🛡️ Icon for Safe Route */}
                🛡️ Safe ({Math.round(safest.safety.score)}% Risk)
            </button>
            
            <button 
                className={`filter-btn fast ${selectedRoute === fastest ? 'active' : ''}`} 
                onClick={() => setSelectedRoute(fastest)}
            >
                {/* ⚡ Icon for Fast Route */}
                ⚡ Fast ({fastest.summary.duration})
            </button>
        </div>
    );
};

export default RouteSelector;