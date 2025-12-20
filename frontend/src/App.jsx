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
const hazardIcon = L.divIcon({ html: '<div style="font-size: 25px; line-height: 1;">⚠️</div>', className: 'custom-icon', iconSize: [25, 25], iconAnchor: [12, 12] });

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
  
  // NEW: State for Hazards
  const [hazards, setHazards] = useState([]);

  // UI States
  const [showLegend, setShowLegend] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  
  const [recommendation, setRecommendation] = useState(null);
  const watchId = useRef(null);

  // --- API URL (Change to localhost if testing locally) ---
  const BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/api' 
        : 'https://route-safety-backend.onrender.com/api';

  // --- 1. FETCH HAZARDS ON LOAD ---
  useEffect(() => {
    fetchHazards();
  }, []);

  const fetchHazards = async () => {
    try {
        const res = await fetch(`${BASE_URL}/hazards`);
        const data = await res.json();
        setHazards(data);
    } catch (e) { console.error("Error fetching hazards:", e); }
  };

  // --- 2. REPORT HAZARD TO BACKEND ---
  const reportHazardToBackend = async (type, lat, lon) => {
    try {
        const res = await fetch(`${BASE_URL}/report-hazard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: lat,
                longitude: lon,
                hazardType: type,
                description: "Reported by User"
            })
        });
        if (res.ok) {
            alert(`✅ Success! ${type} reported.`);
            fetchHazards(); // Refresh map immediately
        } else {
            alert("❌ Failed to report hazard.");
        }
    } catch (e) { alert("Error connecting to server."); }
  };

  const confirmHazard = (type) => {
    if (!currentLocation) { alert("⚠️ Waiting for GPS..."); return; }
    const [lat, lon] = currentLocation;
    
    // Call the new backend function instead of just alerting
    reportHazardToBackend(type, lat, lon);
    
    setShowReportMenu(false);
  };

  // --- HELPER: FETCH ROUTE ---
  const fetchRouteData = async (startLoc, endLoc) => {
      setLoading(true);
      setAllRoutes(null); setCurrentRoute(null); setWeather(null); setRecommendation(null);
      
      try {
        const res = await fetch(`${BASE_URL}/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: startLoc, end: endLoc }),
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

  // --- SAFE SPEED LOGIC ---
  const calculateSafeSpeed = (riskScore, distanceString) => {
    let baseSpeed = 50; // City Limit
    if (distanceString && distanceString.includes("km")) {
        const dist = parseFloat(distanceString);
        if (dist > 15) baseSpeed = 80; // Highway Limit
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
        
        {/* RECOMMENDATION */}
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

        {/* WEATHER & RISK FLOAT */}
        {currentRoute && weather && (
            <div className="weather-float">
                <div className="score-circle" style={{ borderColor: currentRoute.safety.color }}>{Math.round(currentRoute.safety.score)}</div>
                <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>{currentRoute.safety.message}</strong>
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '2px' }}>
                        ⏳ {currentRoute.summary.duration} | 📏 {currentRoute.summary.distance}
                    </div>
                    <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>
                        🌡️ {weather.temperature}°C  | 💨 AQI: {weather.aqi}
                    </div>
                </div>
            </div>
        )}

        {/* SAFE SPEED SIGN */}
        {isNavigating && currentRoute && (
            <div className="speed-limit-sign" title="AI Recommended Safe Speed">
                <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight:'bold' }}>Safe</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: '1' }}>{currentSafeSpeed}</div>
                <div style={{ fontSize: '9px' }}>km/h</div>
            </div>
        )}

        <button className="legend-btn" onClick={() => setShowLegend(!showLegend)}>?</button>
        
        {/* LEGEND */}
        {showLegend && (
            <div className="legend-box" onClick={() => setShowLegend(false)} style={{ width: '220px', fontSize: '11px' }}>
                 <h4 style={{margin:'0 0 8px 0', fontSize:'13px', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>🗺️ Map Guide</h4>
                 <div style={{ fontWeight:'bold', marginTop:'6px', color:'#555' }}>Risk Score (0-100)</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#00cc66'}}></span> 0-40: Safe Route</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#ff9933'}}></span> 41-75: Moderate Risk</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#ff4d4d'}}></span> 76-100: High Risk</div>
                 <div style={{ fontWeight:'bold', marginTop:'10px', color:'#555' }}>Markers</div>
                 <div className="legend-item">⚠️ Reported Hazard</div>
            </div>
        )}

        {/* REPORT MENU */}
        {isNavigating && (
            <>
                <button className="report-btn" onClick={() => setShowReportMenu(!showReportMenu)} title="Report Hazard">⚠️</button>
                {showReportMenu && (
                    <div className="report-menu">
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', textAlign:'center', borderBottom:'1px solid #eee', paddingBottom:'5px' }}>Report Hazard</div>
                        <button className="menu-item" onClick={() => confirmHazard('Pothole')}>🕳️ Pothole</button>
                        <button className="menu-item" onClick={() => confirmHazard('Accident')}>💥 Accident</button>
                        <button className="menu-item" onClick={() => confirmHazard('Traffic Jam')}>🚦 Traffic</button>
                        <button className="menu-item" onClick={() => confirmHazard('Police')}>👮 Police</button>
                        <button className="menu-cancel" onClick={() => setShowReportMenu(false)}>Cancel</button>
                    </div>
                )}
            </>
        )}

        {/* MAP */}
        <MapContainer center={defaultCenter} zoom={13} zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
            />
            {currentRoute && <FitBounds route={currentRoute} />}
            
            {/* 3. SHOW ALL HAZARDS ON MAP */}
            {hazards.map((h, i) => (
                <Marker key={i} position={[h.latitude, h.longitude]} icon={hazardIcon}>
                    <Popup>
                        <strong>⚠️ {h.hazardType}</strong><br/>
                        <small>Reported: {new Date(h.reportedAt).toLocaleTimeString()}</small>
                    </Popup>
                </Marker>
            ))}

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