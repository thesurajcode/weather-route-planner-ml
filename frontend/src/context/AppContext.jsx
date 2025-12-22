import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // --- Navigation & Route State ---
    const [currentRoute, setCurrentRoute] = useState(null); 
    const [isNavigating, setIsNavigating] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // --- Input & Location State ---
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [startCoords, setStartCoords] = useState(null);
    const [hazards, setHazards] = useState([]);

    // --- Action: Fetch Route from Backend ---
    const fetchRoute = async (start, end) => {
        setLoading(true);
        try {
            // Sends start/end (text or coords) to your Node backend
            const response = await api.post('/route', { start, end });
            
            // Backend returns: { routes: { fastest, safest }, weather, recommendation }
            setCurrentRoute(response.data);
            setIsNavigating(true);
            return response.data;
        } catch (error) {
            console.error("Fetch Route Error:", error);
            alert("Failed to get route. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetNavigation = () => {
        setIsNavigating(false);
        setCurrentRoute(null);
        setStartAddress('');
        setEndAddress('');
    };

    return (
        <AppContext.Provider value={{
            currentRoute, setCurrentRoute,
            isNavigating, setIsNavigating,
            loading, setLoading,
            startAddress, setStartAddress,
            endAddress, setEndAddress,
            startCoords, setStartCoords,
            hazards, setHazards,
            fetchRoute,
            resetNavigation
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
};