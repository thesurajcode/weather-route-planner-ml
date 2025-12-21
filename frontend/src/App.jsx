import React from 'react';
import './App.css'; 

// ✅ CORRECT: Points to 'Map' folder
import MapContainer from './components/Map/MapContainer'; 

// ✅ CORRECT: Points to 'Controls' folder (Matches your screenshot)
import SearchBar from './components/Controls/SearchBar'; 

import { useApp } from './context/AppContext';

function App() {
  const { isNavigating, routeData, resetNavigation } = useApp();

  return (
    <div className="app-container">
      {/* 1. HEADER & SEARCH AREA */}
      <header className="app-header">
        <div className="logo-area">
          <h1>🛡️ SafeRoute AI</h1>
        </div>
        
        <div className="search-container">
          <SearchBar />
        </div>
      </header>

      {/* 2. MAIN CONTENT (Map) */}
      <main className="map-section">
        <MapContainer />
      </main>

      {/* 3. SAFETY HUD */}
      {isNavigating && routeData && (
        <div className="safety-panel">
          <div className="panel-header">
            <h3>Route Analysis</h3>
            <button onClick={resetNavigation} className="close-btn">✖</button>
          </div>
          
          <div className="route-stats">
             <div className={`status-card ${routeData.recommendation.shouldWait ? 'danger' : 'safe'}`}>
                <span className="icon">{routeData.recommendation.shouldWait ? '⚠️' : '✅'}</span>
                <p>{routeData.recommendation.text}</p>
             </div>

             <div className="weather-card">
                <h4>Weather Impact</h4>
                <div className="weather-grid">
                  <span>🌡️ {Math.round(routeData.weather.temperature)}°C</span>
                  <span>💨 {Math.round(routeData.weather.windSpeed)} km/h</span>
                  <span>🌧️ {routeData.weather.precipitation > 0 ? 'Rainy' : 'Dry'}</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;