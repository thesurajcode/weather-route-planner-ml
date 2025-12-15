import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import './App.css';

// --- ICONS SETUP ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const carIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">🚗</div>', className: 'custom-car-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
const startIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">📍</div>', className: 'custom-icon', iconSize: [30, 30], iconAnchor: [15, 30] });
const destIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">🏁</div>', className: 'custom-icon', iconSize: [30, 30], iconAnchor: [5, 30] });

// --- FEATURE: AUTO ZOOM ---
function FitBounds({ route }) {
    const map = useMap();
    useEffect(() => {
        if (!route || !route.geometry || !route.geometry.coordinates) return;
        try {
            const rawCoords = route.geometry.coordinates.flat(Infinity);
            const latLngs = [];
            for(let i=0; i<rawCoords.length; i+=2){
                latLngs.push([rawCoords[i+1], rawCoords[i]]);
            }
            if (latLngs.length > 0) {
                const bounds = L.latLngBounds(latLngs);
                map.fitBounds(bounds, { padding: [80, 80], animate: true });
            }
        } catch (e) { console.error("Zoom Error:", e); }
    }, [route, map]);
    return null;
}

// --- FEATURE: ARROWS ---
function RouteArrows({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (!map || !positions || positions.length === 0) return;
        try {
            const arrows = L.polylineDecorator(positions, {
                patterns: [{ offset: '50px', repeat: '150px', symbol: L.Symbol.arrowHead({ pixelSize: 12, polygon: false, headAngle: 40, pathOptions: { stroke: true, color: 'white', weight: 3, opacity: 1 } }) }]
            });
            arrows.addTo(map);
            return () => { map.removeLayer(arrows); };
        } catch (e) {}
    }, [map, positions]);
    return null;
}

function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => { 
        if(position && position[0] && position[1]) map.flyTo(position, 16); 
    }, [position, map]);
    return null;
}

function App() {
  const defaultCenter = [28.6139, 77.2090]; 
  const [startAddress, setStartAddress] = useState('');
  const [exactStartCoords, setExactStartCoords] = useState(null); 
  const [endAddress, setEndAddress] = useState('');
  const [allRoutes, setAllRoutes] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // UI States
  const [showLegend, setShowLegend] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // Collapsed by default
  
  const [recommendation, setRecommendation] = useState(null);
  const watchId = useRef(null);

  // --- HELPER: FETCH ROUTE ---
  const fetchRouteData = async (startLoc, endLoc) => {
      setLoading(true);
      setAllRoutes(null); setCurrentRoute(null); setWeather(null); setRecommendation(null);
      
      try {
        const apiUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5001/api/route' 
          : 'https://route-safety-backend.onrender.com/api/route';

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: startLoc, end: endLoc }),
        });
        const data = await res.json();
        
        if (data.routes) {
          setAllRoutes(data.routes);
          setCurrentRoute(data.routes.moderate);
          setWeather(data.weather);
          
          // Auto-hide recommendation after 5 seconds to clear screen
          setRecommendation(data.recommendation);
          setTimeout(() => setRecommendation(null), 5000); 
        } else {
            alert("No routes found.");
        }
      } catch (e) { 
          alert("Error: " + e.message); 
      } finally { 
          setLoading(false); 
      }
  };

  const handleFindRoute = () => {
    if (!startAddress || !endAddress) return alert('Enter addresses.');
    const startToSend = exactStartCoords || startAddress;
    fetchRouteData(startToSend, endAddress);
  };

  const toggleNavigation = () => {
    if (isNavigating) {
      setIsNavigating(false);
      setShowReportMenu(false);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      setCurrentLocation(null);
    } else {
      if (!navigator.geolocation) return alert("Geolocation not supported");
      if (!endAddress) return alert("Please enter a destination first.");

      setIsNavigating(true);
      navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentLocation([latitude, longitude]);
          fetchRouteData(`${latitude},${longitude}`, endAddress);
      }, (err) => console.error(err), { enableHighAccuracy: true });

      watchId.current = navigator.geolocation.watchPosition(p => {
          setCurrentLocation([p.coords.latitude, p.coords.longitude]);
      }, console.error, { enableHighAccuracy: true });
    }
  };

  const confirmHazard = (type) => {
    if (!currentLocation) { alert("⚠️ Waiting for GPS..."); return; }
    const [lat, lon] = currentLocation;
    const time = new Date().toLocaleTimeString();
    alert(`✅ REPORT SUBMITTED!\n\nType: ${type}\n📍 Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}\n🕒 Time: ${time}`);
    setShowReportMenu(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setStartAddress("Locating..."); 
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setExactStartCoords(`${latitude},${longitude}`);
        try {
          const res = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.features.length > 0) {
            setStartAddress([data.features[0].properties.name, data.features[0].properties.city].filter(Boolean).join(", "));
          } else setStartAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch { setStartAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`); }
    }, () => setStartAddress(""), { enableHighAccuracy: true });
  };

  const handleStartTyping = (e) => {
      setStartAddress(e.target.value);
      setExactStartCoords(null); 
  };

  const calculateSafeSpeed = (riskScore, distanceString) => {
    let baseSpeed = 50; 
    if (distanceString && distanceString.includes("km")) {
        const dist = parseFloat(distanceString);
        if (dist > 15) baseSpeed = 80;
    }
    const reductionFactor = (riskScore / 10) * 0.05; 
    let safeSpeed = baseSpeed * (1 - reductionFactor);
    if (riskScore > 75) safeSpeed = Math.min(safeSpeed, 30); 
    return Math.round(safeSpeed);
  };

  const getRouteLine = () => {
      if (!currentRoute?.geometry?.coordinates) return [];
      let rawCoords = currentRoute.geometry.coordinates;
      if (Array.isArray(rawCoords[0]) && Array.isArray(rawCoords[0][0])) rawCoords = rawCoords.flat();
      return rawCoords.filter(c => Array.isArray(c) && c.length >= 2).map(c => [c[1], c[0]]);
  };

  const routeLine = getRouteLine();
  const startCoords = routeLine.length > 0 ? routeLine[0] : null;
  const destCoords = routeLine.length > 0 ? routeLine[routeLine.length - 1] : null;
  const selectRoute = (type) => { if (allRoutes && allRoutes[type]) setCurrentRoute(allRoutes[type]); };
  
  const getAqiColor = (aqi) => { 
      if(aqi <= 2) return "var(--success-green)"; 
      if(aqi === 3) return "var(--warning-yellow)"; 
      return "var(--danger-red)"; 
  };

  const currentSafeSpeed = currentRoute 
    ? calculateSafeSpeed(currentRoute.safety.score, currentRoute.summary.distance) 
    : 0;

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="input-row">
            <input type="text" value={startAddress} onChange={handleStartTyping} placeholder="Start Location" />
            <button onClick={handleUseCurrentLocation} className="icon-btn">📍</button>
        </div>
        <div className="input-row">
            <input type="text" value={endAddress} onChange={(e) => setEndAddress(e.target.value)} placeholder="Destination" />
        </div>
      </div>

      <div className="map-wrapper">
        
        {/* 1. AUTO-HIDING RECOMMENDATION BANNER */}
        {recommendation && (
            <div className="recommendation-banner" 
                 style={{ 
                     background: recommendation.shouldWait ? '#fef3c7' : '#d1fae5', 
                     color: recommendation.shouldWait ? '#b45309' : '#065f46',
                     border: recommendation.shouldWait ? '1px solid #fcd34d' : '1px solid #6ee7b7'
                 }}>
                {recommendation.text}
            </div>
        )}

        {/* 2. MINIMALIST STATS CARD (Click to Expand/Collapse) */}
        {currentRoute && weather && (
            <div className={`stats-card ${showDetails ? 'expanded' : 'collapsed'}`} onClick={() => setShowDetails(!showDetails)}>
                
                {/* Header: Always Visible (Summary) */}
                <div className="stats-header">
                    <div className="score-badge" style={{ backgroundColor: currentRoute.safety.color }}>
                        {Math.round(currentRoute.safety.score)}
                    </div>
                    <div className="stats-summary">
                        <strong>{currentRoute.summary.duration}</strong> • {currentRoute.summary.distance}
                    </div>
                    <div className="stats-toggle">{showDetails ? '▼' : '▲'}</div>
                </div>

                {/* Details: Collapsible */}
                {showDetails && (
                    <div className="stats-details">
                        <div className="stat-row">
                            <span>🌡️ Temp</span>
                            <strong>{weather.temperature}°C</strong>
                        </div>
                        <div className="stat-row">
                            <span>💨 AQI</span>
                            <strong style={{ color: getAqiColor(weather.aqi) }}>{weather.aqi}</strong>
                        </div>
                        <div className="stat-row">
                            <span>🚦 Status</span>
                            <strong>{currentRoute.safety.message}</strong>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 3. SPEED LIMIT (Only in Drive Mode) */}
        {isNavigating && currentRoute && (
            <div className="speed-limit-sign">
                <div className="limit-label">LIMIT</div>
                <div className="limit-value">{currentSafeSpeed}</div>
            </div>
        )}

        <button className="legend-btn" onClick={() => setShowLegend(!showLegend)}>?</button>
        
        {showLegend && (
            <div className="legend-box" onClick={() => setShowLegend(false)}>
                 <h4>Map Guide</h4>
                 <div className="legend-item"><span className="color-dot" style={{background:'var(--success-green)'}}></span> Safe (0-40)</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'var(--warning-yellow)'}}></span> Moderate (41-75)</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'var(--danger-red)'}}></span> High Risk (76+)</div>
            </div>
        )}

        {isNavigating && (
            <>
                <button className="report-btn" onClick={() => setShowReportMenu(!showReportMenu)}>⚠️</button>
                {showReportMenu && (
                    <div className="report-menu">
                        <div className="menu-title">Report Hazard</div>
                        <button className="menu-item" onClick={() => confirmHazard('Pothole')}>🕳️ Pothole</button>
                        <button className="menu-item" onClick={() => confirmHazard('Accident')}>💥 Accident</button>
                        <button className="menu-item" onClick={() => confirmHazard('Traffic')}>🚦 Traffic</button>
                        <button className="menu-cancel" onClick={() => setShowReportMenu(false)}>Cancel</button>
                    </div>
                )}
            </>
        )}

        <MapContainer center={defaultCenter} zoom={13} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {currentRoute && <FitBounds route={currentRoute} />}
            {currentRoute && routeLine.length > 0 && (
                <>
                    <Polyline positions={routeLine} color={currentRoute.safety.color} weight={6} />
                    <RouteArrows positions={routeLine} />
                </>
            )}
            {startCoords && <Marker position={startCoords} icon={startIcon}><Popup>Start: {startAddress}</Popup></Marker>}
            {destCoords && <Marker position={destCoords} icon={destIcon}><Popup>End: {endAddress}</Popup></Marker>}
            {isNavigating && currentLocation && (
                <> <Marker position={currentLocation} icon={carIcon}><Popup>You</Popup></Marker> <RecenterMap position={currentLocation} /> </>
            )}
        </MapContainer>
      </div>

      <div className="bottom-bar">
        {allRoutes && allRoutes.count > 0 && (
            <div className="filter-row">
                <button className="filter-btn" style={{background: 'var(--success-green)', opacity: currentRoute===allRoutes.safest?1:0.5}} onClick={() => selectRoute('safest')}>🛡️ Safe</button>
                <button className="filter-btn" style={{background: 'var(--primary-blue)', opacity: currentRoute===allRoutes.moderate?1:0.5}} onClick={() => selectRoute('moderate')}>⭐ Best</button>
                <button className="filter-btn" style={{background: 'var(--danger-red)', opacity: currentRoute===allRoutes.fastest?1:0.5}} onClick={() => selectRoute('fastest')}>⚡ Fast</button>
            </div>
        )}
        <div className="button-row">
            <button onClick={handleFindRoute} disabled={loading} className="action-btn blue">{loading ? 'Searching...' : 'Get Route'}</button>
            <button onClick={toggleNavigation} className={`action-btn ${isNavigating ? 'red' : 'green'}`}>{isNavigating ? "🛑 Stop" : "🚀 Drive"}</button>
        </div>
      </div>
    </div>
  );
}

export default App;