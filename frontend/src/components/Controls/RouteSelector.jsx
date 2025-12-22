import React from 'react';
import { useApp } from '../../context/AppContext';

const RouteSelector = () => {
    const { currentRoute } = useApp();
    
    if (!currentRoute) return null;

    return (
        <div className="route-selector-control">
            <label className="toggle-row">
                <input type="checkbox" defaultChecked disabled />
                {/* ✅ CORRECT: Quotes around "dot safe" */}
                <span className="dot safe"></span> 
                <div className="toggle-text">
                    <strong>Safest Route</strong>
                    <small>Recommended</small>
                </div>
            </label>

            <label className="toggle-row">
                <input type="checkbox" defaultChecked disabled />
                <span className="dot fast"></span>
                <div className="toggle-text">
                    <strong>Fastest Route</strong>
                    <small>{currentRoute.routes.fastest.summary.duration}</small>
                </div>
            </label>
        </div>
    );
};

export default RouteSelector;