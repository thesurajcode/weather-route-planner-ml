import React from 'react';
import App from '../App';
import { AppProvider } from '../context/AppContext';
import { LocationProvider } from '../context/LocationContext';

const Home = () => {
    return (
        <LocationProvider>
            <AppProvider>
                <App />
            </AppProvider>
        </LocationProvider>
    );
};

export default Home;