import React from 'react';

const WeatherHUD = ({ data }) => {
    const { weather, recommendation } = data;

    return (
        <div className="weather-hud">
            <h3>Route Safety Score</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
                {data.routes.safest.safety.score}/100
            </div>
            
            <p><strong>Recommendation:</strong> {recommendation.text}</p>
            
            <hr />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>🌡️ {Math.round(weather.temperature)}°C</div>
                <div>💨 {weather.windSpeed} km/h</div>
                <div>🌧️ {weather.precipitation}mm</div>
            </div>
        </div>
    );
};

export default WeatherHUD;