import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "leaflet/dist/leaflet.css";
import "./styles/index.css";

/* 🔧 FIX LEAFLET ICONS (REQUIRED FOR VITE) */
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
