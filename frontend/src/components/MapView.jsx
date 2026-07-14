import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import HazardPopup from "./HazardPopup";

/* Auto-fit map */
function FitBounds({ geometry }) {
  const map = useMap();
  if (!geometry || geometry.length < 2) return null;
  map.fitBounds(geometry);
  return null;
}

/* Capture map clicks ONLY when reporting */
function MapClickHandler({ enabled, onClick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onClick(e.latlng);
    }
  });
  return null;
}

function MapView({ routes, mode, reportMode, setReportMode }) {
  const defaultCenter = [28.6139, 77.2090]; // Delhi

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hazards, setHazards] = useState([]);

  /* Load hazards from backend */
  const loadHazards = () => {
    fetch("http://localhost:5000/api/hazards")
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => {
        console.log("Hazards:", data);
        setHazards(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log("Hazard fetch error:", err);
        setHazards([]);
      });
  };

  useEffect(() => {
    loadHazards();
  }, []);

  const handleMapClick = (point) => {
    setSelectedPoint(point);
    setReportMode(false);
  };

  /* EMPTY ROUTE VIEW */
  if (!routes || routes.length === 0) {
    return (
      <MapContainer
        center={defaultCenter}
        zoom={11}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapClickHandler
          enabled={reportMode}
          onClick={handleMapClick}
        />

        <HazardPopup
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          onSuccess={loadHazards}
        />
      </MapContainer>
    );
  }

  const sorted = [...routes].sort((a, b) => a.duration - b.duration);
  const route = sorted[0];

  return (
    <MapContainer
      center={route.geometry[0]}
      zoom={12}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <FitBounds geometry={route.geometry} />

      <MapClickHandler
        enabled={reportMode}
        onClick={handleMapClick}
      />

      {/* FAST ROUTE */}
      {mode === "fast" && (
        <Polyline
          positions={route.geometry}
          pathOptions={{ color: "blue", weight: 6 }}
        >
          <Popup>
            🚀 Fast Route <br />
            Time: {(route.duration / 60).toFixed(1)} min
          </Popup>
        </Polyline>
      )}

      {/* SAFE ROUTE */}
      {mode === "safe" && (
        <Polyline
          positions={route.geometry}
          pathOptions={{
            color: "green",
            weight: 6,
            dashArray: "8,6"
          }}
        >
          <Popup>
            🛡 Safe Route <br />
            Risk Score: {route.riskScore}
          </Popup>
        </Polyline>
      )}

      {/* Start Marker */}
      <Marker position={route.geometry[0]}>
        <Popup>Start</Popup>
      </Marker>

      {/* End Marker */}
      <Marker position={route.geometry[route.geometry.length - 1]}>
        <Popup>Destination</Popup>
      </Marker>

      {/* Hazard Markers */}
      {Array.isArray(hazards) &&
        hazards.length > 0 &&
        hazards.map((h) => (
          <Marker
            key={h._id}
            position={[h.lat, h.lon]}
          >
            <Popup>
              ⚠ <strong>{h.type}</strong>
              <br />
              Severity: {h.severity}
            </Popup>
          </Marker>
        ))}

      {/* Report Hazard Popup */}
      <HazardPopup
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        onSuccess={loadHazards}
      />
    </MapContainer>
  );
}

export default MapView;