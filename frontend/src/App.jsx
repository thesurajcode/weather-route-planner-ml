import React from 'react';
import './App.css'; 

// Components - We'll create these in the next steps
import MapContainer from './components/Map/MapContainer'; 
import SearchBar from './components/Controls/SearchBar'; 
import WeatherHUD from './components/Overlays/WeatherHUD';

import { useApp } from './context/AppContext';

function App() {
  const { isNavigating, currentRoute, loading } = useApp();

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <header className="app-header">
        <div className="logo-area">
          <h1>🛡️ SafeRoute AI</h1>
        </div>
        
        <div className="search-container">
          <SearchBar />
        </div>
      </header>

      {/* --- MAIN CONTENT (MAP) --- */}
      <main className="map-section">
        {loading && (
          <div className="map-overlay-loading">
            <div className="spinner"></div>
            <p>Analyzing Route Safety...</p>
          </div>
        )}
        <MapContainer />
      </main>

      {/* --- SAFETY & WEATHER OVERLAY --- */}
      {/* This only shows up after you click "Get Route" */}
      {isNavigating && currentRoute && (
        <WeatherHUD data={currentRoute} />
      )}
    </div>
  );
}

export default App;