import { Marker, Popup } from "react-leaflet";
import { useState } from "react";

function HazardPopup({ point, onClose, onSuccess }) {
  const [type, setType] = useState("ACCIDENT");
  const [severity, setSeverity] = useState(3);

  if (!point) return null;

  async function submitHazard() {
    await fetch("http://localhost:5000/api/hazards/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: point.lat,
        lon: point.lng,
        type,
        severity
      })
    });

    onSuccess();
    onClose();
  }

  return (
    <Marker position={[point.lat, point.lng]}>
      <Popup onClose={onClose}>
        <h4>⚠ Report Hazard</h4>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>ACCIDENT</option>
          <option>POTHOLE</option>
          <option>FOG</option>
          <option>WATER_LOGGING</option>
          <option>TRAFFIC</option>
        </select>

        <br />

        <label>Severity (1–5)</label>
        <input
          type="number"
          min="1"
          max="5"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        />

        <br />

        <button onClick={submitHazard}>Submit</button>
      </Popup>
    </Marker>
  );
}

export default HazardPopup;
