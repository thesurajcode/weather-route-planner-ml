import React, { createContext, useState, useContext } from 'react';
import api from '../services/api'; // ✅ Import your API service

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // --- STATE ---
    // ✅ FIX 1: Renamed 'routeData' to 'currentRoute' so MapContainer can find it
    const [currentRoute, setCurrentRoute] = useState(null); 
    
    const [selectedRoute, setSelectedRoute] = useState(null); // 'safest' or 'fastest'
    const [hazards, setHazards] = useState([]);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Input State
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [startCoords, setStartCoords] = useState(null); 

    // --- ACTIONS ---
    
    // ✅ FIX 2: Added the function to call the Backend
    const fetchRoute = async (start, end) => {
        try {
            console.log("Fetching route for:", start, "to", end);
            const response = await api.post('/route', { start, end });
            
            // Save the WHOLE backend response (routes + weather) into state
            setCurrentRoute(response.data);
            setIsNavigating(true);
            
            console.log("Route Data Saved:", response.data); // Debug log
        } catch (error) {
            console.error("API Fetch Error:", error);
            alert("Could not fetch route. Check console for details.");
        }
    };

    const resetNavigation = () => {
        setIsNavigating(false);
        setCurrentRoute(null);
        setSelectedRoute(null);
        setStartAddress('');
        setEndAddress('');
    };

    return (
        <AppContext.Provider value={{
            currentRoute, setCurrentRoute, // ✅ Now matches MapContainer
            fetchRoute, // ✅ Expose this so SearchBox can call it
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