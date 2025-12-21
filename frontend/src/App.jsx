import React from 'react';
import { AppProvider } from './context/AppContext';
import { LocationProvider } from './context/LocationContext';
import Home from './pages/Home';
import './assets/App.css'; // ✅ Connects your styles

function App() {
    return (
        // 1. We wrap the app in LocationProvider to track GPS
        <LocationProvider>
            {/* 2. We wrap it in AppProvider to manage Routes/Hazards */}
            <AppProvider>
                {/* 3. We show the main Home screen */}
                <Home />
            </AppProvider>
        </LocationProvider>
    );
}

export default App;