import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // --- STATE ---
    const [routeData, setRouteData] = useState(null); // Stores { routes, weather, recommendation }
    const [selectedRoute, setSelectedRoute] = useState(null); // 'safest' or 'fastest'
    const [hazards, setHazards] = useState([]);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Input State
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [startCoords, setStartCoords] = useState(null); // Exact GPS coords

    // --- ACTIONS ---
    const resetNavigation = () => {
        setIsNavigating(false);
        setRouteData(null);
        setSelectedRoute(null);
    };

    return (
        <AppContext.Provider value={{
            routeData, setRouteData,
            selectedRoute, setSelectedRoute,
            hazards, setHazards,
            isNavigating, setIsNavigating,
            startAddress, setStartAddress,
            endAddress, setEndAddress,
            startCoords, setStartCoords,
            resetNavigation
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);