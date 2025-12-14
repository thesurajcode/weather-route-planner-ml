import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import './App.css';

// Fix Default Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const carIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">🚗</div>', className: 'custom-car-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
const destIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">🏁</div>', className: 'custom-icon', iconSize: [30, 30], iconAnchor: [5, 30] });

// --- COMPONENT: DRAWS ARROWS ON ROUTE ---
function RouteArrows({ positions }) {
    const map = useMap();
    useEffect(() => {
        // Safety check: Don't try to draw if positions are empty/null
        if (!map || !positions || positions.length === 0) return;
        
        const arrows = L.polylineDecorator(positions, {
            patterns: [{ offset: '100px', repeat: '200px', symbol: L.Symbol.arrowHead({ pixelSize: 10, polygon: false, headAngle: 50, pathOptions: { stroke: true, color: 'white', weight: 2.5, opacity: 1 } }) }]
        });
        arrows.addTo(map);
        return () => { map.removeLayer(arrows); };
    }, [map, positions]);
    return null;
}

// Auto-center map
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => { 
        // Safety check: Only fly to valid positions
        if(position && position[0] && position[1]) {
            map.flyTo(position, 16, { animate: true }); 
        }
    }, [position, map]);
    return null;
}

function App() {
  const delhiPosition = [28.6139, 77.2090];
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [allRoutes, setAllRoutes] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  
  const watchId = useRef(null);

  // ✅ SAFELY Extract Destination Coords
  const getDestinationCoords = () => {
    if (!currentRoute?.geometry?.coordinates) return null;
    const coords = currentRoute.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return null;
    
    const lastPoint = coords[coords.length - 1]; 
    // Ensure we have valid numbers
    if (lastPoint && !isNaN(lastPoint[1]) && !isNaN(lastPoint[0])) {
        return [lastPoint[1], lastPoint[0]]; // [lat, lon]
    }
    return null;
  };

  // ✅ SAFELY Extract Route Line
  const getRouteLine = () => {
      if (!currentRoute?.geometry?.coordinates) return [];
      const coords = currentRoute.geometry.coordinates;
      if (!Array.isArray(coords)) return [];
      
      return coords.map(c => [c[1], c[0]]); // Swap to [lat, lon]
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setStartAddress("Locating..."); 
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.features.length > 0) {
            const p = data.features[0].properties;
            const addressName = [p.name, p.street, p.city].filter(Boolean).join(", ");
            setStartAddress(addressName);
          } else {
            setStartAddress(`${latitude}, ${longitude}`);
          }
        } catch { 
            setStartAddress(`${latitude}, ${longitude}`); 
        }
    }, (err) => {
        console.error(err);
        setStartAddress(""); 
        alert("Could not get location.");
    }, { enableHighAccuracy: true });
  };

  const handleFindRoute = async () => {
    if (!startAddress || !endAddress) return alert('Enter addresses.');
    setLoading(true); setAllRoutes(null); setCurrentRoute(null); setWeather(null); setRecommendation(null);
    
    try {
      // Determine API URL based on environment
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api/route' 
        : 'https://route-safety-backend.onrender.com/api/route';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startAddress, end: endAddress }),
      });
      const data = await res.json();
      
      if (data.routes) {
        setAllRoutes(data.routes);
        setCurrentRoute(data.routes.moderate);
        setWeather(data.weather);
        setRecommendation(data.recommendation);
      } else {
        alert("No routes found.");
      }
    } catch (e) { 
        console.error(e);
        alert("Error: " + e.message); 
    } finally { 
        setLoading(false); 
    }
  };

  const toggleNavigation = () => {
    if (isNavigating) {
      setIsNavigating(false);
      setShowReportMenu(false);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      setCurrentLocation(null);
    } else {
      setIsNavigating(true);
      navigator.geolocation.getCurrentPosition(p => setCurrentLocation([p.coords.latitude, p.coords.longitude]));
      watchId.current = navigator.geolocation.watchPosition(p => setCurrentLocation([p.coords.latitude, p.coords.longitude]), console.error, { enableHighAccuracy: true });
    }
  };

  const confirmHazard = (type) => {
    if (!currentLocation) { alert("⚠️ Waiting for GPS..."); return; }
    const [lat, lon] = currentLocation;
    const time = new Date().toLocaleTimeString();
    alert(`✅ REPORT SUBMITTED!\n\nType: ${type}\n📍 Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}\n🕒 Time: ${time}`);
    setShowReportMenu(false);
  };

  const selectRoute = (type) => { if (allRoutes && allRoutes[type]) setCurrentRoute(allRoutes[type]); };
  const getAqiColor = (aqi) => { if(aqi <= 2) return "#00cc66"; if(aqi === 3) return "#ff9933"; return "#cc0000"; };

  const calculateSafeSpeed = (riskScore, roadType = 'City Street') => {
    let baseSpeed = roadType === 'Highway' ? 80 : 50; 
    const reductionFactor = (riskScore / 10) * 0.05; 
    let safeSpeed = baseSpeed * (1 - reductionFactor);
    if (riskScore > 75) safeSpeed = Math.min(safeSpeed, 30); 
    return Math.round(safeSpeed);
  };

  const currentSafeSpeed = currentRoute 
    ? calculateSafeSpeed(currentRoute.safety.score, currentRoute.summary.distance.includes("km") && parseFloat(currentRoute.summary.distance) > 15 ? 'Highway' : 'City Street') 
    : 0;

  // Pre-calculate variables for rendering to ensure safety
  const destCoords = getDestinationCoords();
  const routeLine = getRouteLine();

  return (
    <div className="app-container">
      {/* 1. TOP BAR */}
      <div className="top-bar">
        <div className="input-row">
            <input type="text" value={startAddress} onChange={(e) => setStartAddress(e.target.value)} placeholder="Start Location" />
            <button onClick={handleUseCurrentLocation} className="icon-btn">📍</button>
        </div>
        <div className="input-row">
            <input type="text" value={endAddress} onChange={(e) => setEndAddress(e.target.value)} placeholder="Destination" />
        </div>
      </div>

      {/* 2. MIDDLE MAP AREA */}
      <div className="map-wrapper">
        {recommendation && (
            <div style={{
                position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                background: recommendation.shouldWait ? '#fff3cd' : '#d4edda',
                color: '#333', padding: '10px 15px', borderRadius: '20px',
                fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                zIndex: 1000, width: '90%', maxWidth: '350px', textAlign: 'center',
                border: recommendation.shouldWait ? '1px solid #ffeeba' : '1px solid #c3e6cb'
            }}>
                {recommendation.text}
            </div>
        )}

        {currentRoute && weather && (
            <div className="weather-float">
                <div className="score-circle" style={{ borderColor: currentRoute.safety.color }}>{Math.round(currentRoute.safety.score)}</div>
                <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>{currentRoute.safety.message}</strong>
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '2px' }}>
                        ⏳ {currentRoute.summary.duration} | 📏 {currentRoute.summary.distance}
                    </div>
                    <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>
                        🌡️ Temp: {weather.temperature}°C 
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: getAqiColor(weather.aqi) }}>
                        💨 AQI: {weather.aqi} - {weather.aqiText}
                    </div>
                </div>
            </div>
        )}

        {isNavigating && currentRoute && (
            <div className="speed-limit-sign" title="AI Recommended Safe Speed">
                <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Safe</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', lineHeight: '1' }}>{currentSafeSpeed}</div>
                <div style={{ fontSize: '10px' }}>km/h</div>
            </div>
        )}

        <button className="legend-btn" title="Help" onClick={() => setShowLegend(!showLegend)} style={{ background: showLegend ? '#eee' : 'white' }}>?</button>
        {showLegend && (
            <div className="legend-box" onClick={() => setShowLegend(false)}>
                 <h4 style={{margin:'0 0 8px 0'}}>Map Guide</h4>
                 <div className="legend-item"><span className="color-dot" style={{background:'#00cc66'}}></span> Safe (0-30)</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#ff9933'}}></span> Moderate (31-70)</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#ff4d4d'}}></span> High Risk (71+)</div>
            </div>
        )}

        {isNavigating && (
            <>
                <button className="report-btn" onClick={() => setShowReportMenu(!showReportMenu)} title="Report Hazard">⚠️</button>
                {showReportMenu && (
                    <div className="report-menu">
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', textAlign:'center' }}>Report Hazard</div>
                        <button className="menu-item" onClick={() => confirmHazard('Pothole')}>🕳️ Pothole</button>
                        <button className="menu-item" onClick={() => confirmHazard('Accident')}>💥 Accident</button>
                        <button className="menu-cancel" onClick={() => setShowReportMenu(false)}>Cancel</button>
                    </div>
                )}
            </>
        )}

        <MapContainer center={delhiPosition} zoom={13} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* SAFE ROUTE DRAWING: Extra strict checks to prevent crashes */}
            {currentRoute && routeLine.length > 0 && (
                <>
                    <Polyline positions={routeLine} color={currentRoute.safety.color} weight={6} />
                    <RouteArrows positions={routeLine} />
                    
                    {/* ✅ CRITICAL FIX: Ensure destCoords is strictly not null before rendering Marker */}
                    {destCoords && destCoords[0] && destCoords[1] && (
                        <Marker position={destCoords} icon={destIcon}>
                            <Popup>Destination: {endAddress}</Popup>
                        </Marker>
                    )}
                </>
            )}

            {isNavigating && currentLocation && currentLocation[0] && currentLocation[1] && (
                <> <Marker position={currentLocation} icon={carIcon}><Popup>You</Popup></Marker> <RecenterMap position={currentLocation} /> </>
            )}
        </MapContainer>
      </div>

      {/* 3. BOTTOM BUTTONS */}
      <div className="bottom-bar">
        {allRoutes && allRoutes.count > 0 && (
            <div className="filter-row">
                <button className="filter-btn" style={{background: '#00cc66', opacity: currentRoute===allRoutes.safest?1:0.5}} onClick={() => selectRoute('safest')}>🛡️ Safe</button>
                <button className="filter-btn" style={{background: '#007bff', opacity: currentRoute===allRoutes.moderate?1:0.5}} onClick={() => selectRoute('moderate')}>⭐ Best</button>
                <button className="filter-btn" style={{background: '#ff4d4d', opacity: currentRoute===allRoutes.fastest?1:0.5}} onClick={() => selectRoute('fastest')}>⚡ Fast</button>
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