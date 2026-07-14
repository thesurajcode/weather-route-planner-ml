import { useState, useEffect } from "react";
import RouteForm from "./components/RouteForm";
import MapView from "./components/MapView";
import WeatherInfo from "./components/WeatherInfo";

function App() {
  const [routes, setRoutes] = useState([]);
  const [mode, setMode] = useState("fast");

  // 🆕 Hazard reporting mode
  const [reportMode, setReportMode] = useState(false);

  // 🆕 Risk score states
  const [riskScore, setRiskScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState("");

  // Weather from backend
  const currentWeather = routes.length > 0 ? routes[0].weather : null;

  // ✅ Update risk score whenever routes change
  useEffect(() => {
    if (routes.length > 0) {
      setRiskScore(routes[0].riskScore);
      setRiskLevel(routes[0].classification);
    } else {
      setRiskScore(null);
      setRiskLevel("");
    }
  }, [routes]);

  return (
    <div className="app">
      <h2 style={{ textAlign: "center" }}>
        Weather-based Route Planner
      </h2>

      {/* INPUT FORM */}
      <RouteForm setRoutes={setRoutes} mode={mode} />

      {/* ROUTE MODE BUTTONS */}
      <div style={{ textAlign: "center", margin: "10px" }}>
        <button
          onClick={() => setMode("fast")}
          style={{
            marginRight: "10px",
            background: mode === "fast" ? "#1e90ff" : "#ccc",
            color: "white",
            padding: "8px 12px",
            border: "none",
            cursor: "pointer"
          }}
        >
          🚀 Fast Route
        </button>

        <button
          onClick={() => setMode("safe")}
          style={{
            background: mode === "safe" ? "green" : "#ccc",
            color: "white",
            padding: "8px 12px",
            border: "none",
            cursor: "pointer"
          }}
        >
          🛡 Safe Route
        </button>

        {/* REPORT HAZARD BUTTON */}
        <button
          onClick={() => setReportMode(!reportMode)}
          style={{
            marginLeft: "10px",
            background: reportMode ? "red" : "#555",
            color: "white",
            padding: "8px 12px",
            border: "none",
            cursor: "pointer"
          }}
        >
          ⚠ Report Hazard
        </button>
      </div>

      {/* WEATHER INFO */}
      <WeatherInfo weather={currentWeather} />

      {/* 🆕 RISK SCORE DISPLAY */}
      {riskScore !== null && (
        <div
          style={{
            margin: "12px auto",
            padding: "10px",
            maxWidth: "320px",
            border: "1px solid #000",
            borderRadius: "6px",
            backgroundColor: "#fff",
            textAlign: "center"
          }}
        >
          <strong>Risk Score:</strong> {riskScore} <br />
          <strong>Risk Level:</strong> {riskLevel}
        </div>
      )}

      {/* MAP VIEW */}
      <MapView
        routes={routes}
        mode={mode}
        reportMode={reportMode}
        setReportMode={setReportMode}
      />
    </div>
  );
}

export default App;
