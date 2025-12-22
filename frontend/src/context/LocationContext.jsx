import React, { createContext, useState, useContext } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [accuracy, setAccuracy] = useState(null);

    const updateLocation = () => {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition((pos) => {
            setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
            setAccuracy(pos.coords.accuracy);
        });
    };

    return (
        <LocationContext.Provider value={{ userLocation, accuracy, updateLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);