const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const AIR_POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

export async function getWeatherAndAQI(lat, lon) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  // 🌦 Weather
  const weatherRes = await fetch(
    `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  const weatherData = await weatherRes.json();

  // 🌫 Air pollution
  const airRes = await fetch(
    `${AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}`
  );
  const airData = await airRes.json();

  const components = airData?.list?.[0]?.components || {};

  // ✅ Numeric AQI using PM2.5
  const numericAQI = Math.round(components.pm2_5 ?? 0);

  const rainMM =
    weatherData.rain?.["1h"] ??
    weatherData.rain?.["3h"] ??
    0;

  return {
    ml: {
      temperature: weatherData.main.temp,
      windSpeed: weatherData.wind.speed,
      rainfall: rainMM,
      aqi: numericAQI
    },

    ui: {
      temp: weatherData.main.temp,
      wind: weatherData.wind.speed,
      rain: rainMM > 0,
      condition: weatherData.weather[0].main,
      aqi: numericAQI
    }
  };
}
