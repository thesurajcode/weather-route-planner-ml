import { useState } from "react";

function HazardForm({ point, onClose, onSuccess }) {
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

    alert("Hazard reported!");
    onClose();
    onSuccess();
  }

  return (
    <div className="hazard-form">
      <h4>Report Hazard</h4>

      <p>
        📍 {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
      </p>

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option>ACCIDENT</option>
        <option>POTHOLE</option>
        <option>FOG</option>
        <option>WATER_LOGGING</option>
        <option>TRAFFIC</option>
      </select>

      <input
        type="number"
        min="1"
        max="5"
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
      />

      <div style={{ marginTop: "8px" }}>
        <button onClick={submitHazard}>Submit</button>
        <button onClick={onClose} style={{ marginLeft: "8px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default HazardForm;
