import React from 'react';
import { useApp } from '../../context/AppContext';

const WeatherHUD = () => {
    const { currentRoute } = useApp();
    if (!currentRoute) return null;

    const { weather, routes } = currentRoute;

    return (
        <div className="weather-hud">
            <h3>Live Environment</h3>
            <div className="weather-grid">
                <div className="weather-item">🌡️ {Math.round(weather.temperature)}°C</div>
                <div className="weather-item">💨 {weather.windSpeed} km/h</div>
                <div className="weather-item">🌧️ {weather.precipitation} mm</div>
            </div>
            
            <div className="safety-comparison">
                <div className="comparison-card fast">
                    <span>⚡ Fast Route</span>
                    <strong>Score: {routes.fastest.safety.score}</strong>
                </div>
                <div className="comparison-card safe">
                    <span>🛡️ Safe Route</span>
                    <strong>Score: {routes.safest.safety.score}</strong>
                </div>
            </div>
        </div>
    );
};

export default WeatherHUD;