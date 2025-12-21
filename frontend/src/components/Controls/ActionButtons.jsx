import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRoute } from '../../services/routeService';
import { useLocation } from '../../context/LocationContext';

const ActionButtons = () => {
    const { 
        startAddress, endAddress, startCoords, 
        setRouteData, setSelectedRoute, 
        isNavigating, setIsNavigating, resetNavigation 
    } = useApp();
    
    const { startTracking, stopTracking } = useLocation();
    const [loading, setLoading] = useState(false);

    const handleGetRoute = async () => {
        if (!startAddress || !endAddress) return alert("Please enter locations");
        setLoading(true);
        try {
            // Use coords if available, else address
            const start = startCoords || startAddress;
            const data = await fetchRoute(start, endAddress);
            if (data.routes) {
                setRouteData(data);
                setSelectedRoute(data.routes.safest); // Default to Safe
            }
        } catch (e) { alert("Failed to get route"); }
        setLoading(false);
    };

    const toggleDrive = () => {
        if (isNavigating) {
            resetNavigation();
            stopTracking();
        } else {
            if (!startAddress) return alert("Select a route first");
            setIsNavigating(true);
            startTracking();
        }
    };

    return (
        <div className="button-row">
            <button onClick={handleGetRoute} disabled={loading} className="action-btn blue">
                {loading ? 'Thinking...' : 'Get Route'}
            </button>
            <button onClick={toggleDrive} className={`action-btn ${isNavigating ? 'red' : 'green'}`}>
                {isNavigating ? '🛑 Stop' : '🚀 Drive'}
            </button>
        </div>
    );
};

export default ActionButtons;