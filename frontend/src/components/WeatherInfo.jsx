function WeatherInfo({ weather }) {
  if (!weather) return null;

  return (
    <div className="weather-panel">
      <h3>🌦 Weather & AQI</h3>

      <div className="weather-grid">
        <div>
          <strong>🌡 Temperature</strong>
          <p>{weather.temp} °C</p>
        </div>

        <div>
          <strong>💨 Wind Speed</strong>
          <p>{weather.wind} m/s</p>
        </div>

        <div>
          <strong>🌧 Rain</strong>
          <p>{weather.rain ? "Yes" : "No"}</p>
        </div>

        <div>
          <strong>☁ Condition</strong>
          <p>{weather.condition}</p>
        </div>

        <div>
          <strong>🫁 AQI</strong>
          <p>{weather.aqi}</p>
        </div>
      </div>
    </div>
  );
}

export default WeatherInfo;
