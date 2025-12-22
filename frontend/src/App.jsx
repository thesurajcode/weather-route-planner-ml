import React from 'react';
import './App.css';
import MapContainer from './components/Map/MapContainer';
import SearchBar from './components/Controls/SearchBar';
import WeatherHUD from './components/Overlays/WeatherHUD';
import Recommendation from './components/Overlays/Recommendation';
import Legend from './components/Overlays/Legend';
import { useApp } from './context/AppContext';

function App() {
  const { isNavigating, currentRoute, loading } = useApp();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">🛡️</span>
          <h1>SafeRoute AI</h1>
        </div>
        <div className="controls-section">
          <SearchBar />
        </div>
      </header>

      <main className="main-content">
        <div className="map-wrapper">
          {loading && <div className="loading-spinner">Analyzing Safety...</div>}
          <MapContainer />
          <Legend />
        </div>

        {isNavigating && currentRoute && (
          <aside className="info-panel">
            <Recommendation />
            <WeatherHUD />
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;