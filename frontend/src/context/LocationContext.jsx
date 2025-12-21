import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [currentLocation, setCurrentLocation] = useState(null); // [lat, lon]
    const watchId = useRef(null);

    const startTracking = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");

        // Get initial position immediately
        navigator.geolocation.getCurrentPosition(
            (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true }
        );

        // Watch for movement
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.error("GPS Watch Error:", err),
            { enableHighAccuracy: true }
        );
    };

    const stopTracking = () => {
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        setCurrentLocation(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
    }, []);

    return (
        <LocationContext.Provider value={{ currentLocation, startTracking, stopTracking }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);