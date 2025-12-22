import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [currentRoute, setCurrentRoute] = useState(null); // Holds { fastest, safest, weather }
    const [isNavigating, setIsNavigating] = useState(false);
    const [isDriving, setIsDriving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hazards, setHazards] = useState([]);
    
    // Inputs
    const [startAddress, setStartAddress] = useState('');
    const [endAddress, setEndAddress] = useState('');
    const [startCoords, setStartCoords] = useState(null);

    // Fetch hazards from MongoDB on load
    const fetchHazards = async () => {
        try {
            const res = await api.get('/hazards');
            setHazards(res.data);
        } catch (err) {
            console.error("Error fetching hazards:", err);
        }
    };

    useEffect(() => {
        fetchHazards();
    }, []);

    const fetchRoute = async (start, end) => {
        setLoading(true);
        try {
            const response = await api.post('/route', { start, end });
            setCurrentRoute(response.data);
            setIsNavigating(true);
        } catch (error) {
            console.error("Route Fetch Error:", error);
            alert("Failed to calculate routes. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const resetNavigation = () => {
        setIsNavigating(false);
        setIsDriving(false);
        setCurrentRoute(null);
    };

    return (
        <AppContext.Provider value={{
            currentRoute, setCurrentRoute,
            isNavigating, setIsNavigating,
            isDriving, setIsDriving,
            loading, hazards, setHazards,
            startAddress, setStartAddress,
            endAddress, setEndAddress,
            startCoords, setStartCoords,
            fetchRoute, resetNavigation, fetchHazards
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);