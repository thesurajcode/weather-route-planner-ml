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

// Custom Icons (Emojis)
const carIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">🚗</div>', className: 'custom-car-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
const startIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">📍</div>', className: 'custom-icon', iconSize: [30, 30], iconAnchor: [15, 30] });
const destIcon = L.divIcon({ html: '<div style="font-size: 30px; line-height: 1;">🏁</div>', className: 'custom-icon', iconSize: [30, 30], iconAnchor: [5, 30] });

// --- FEATURE: AUTO ZOOM ---
function FitBounds({ route }) {
    const map = useMap();
    useEffect(() => {
        if (!route || !route.geometry || !route.geometry.coordinates) return;
        try {
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            if (coords.length > 0) {
                const bounds = L.latLngBounds(coords);
                map.fitBounds(bounds, { padding: [80, 80], animate: true }); // Increased padding
            }
        } catch (e) {
            console.error("Zoom Error:", e);
        }
    }, [route, map]);
    return null;
}

// --- FEATURE: ARROWS ON LINE ---
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
  const defaultCenter = [28.6139, 77.2090]; // Delhi
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

  // Extract Coordinates Safely
  const getCoord = (index) => {
    if (!currentRoute?.geometry?.coordinates) return null;
    const coords = currentRoute.geometry.coordinates;
    const point = index === -1 ? coords[coords.length - 1] : coords[index];
    if (Array.isArray(point) && point.length >= 2) return [point[1], point[0]];
    return null;
  };

  const startCoords = getCoord(0);
  const destCoords = getCoord(-1);

  const getRouteLine = () => {
      if (!currentRoute?.geometry?.coordinates) return [];
      return currentRoute.geometry.coordinates.map(c => [c[1], c[0]]);
  };

  const routeLine = getRouteLine();

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
            setStartAddress([p.name, p.street, p.city].filter(Boolean).join(", "));
          } else setStartAddress(`${latitude}, ${longitude}`);
        } catch { setStartAddress(`${latitude}, ${longitude}`); }
    }, () => setStartAddress(""), { enableHighAccuracy: true });
  };

  const handleFindRoute = async () => {
    if (!startAddress || !endAddress) return alert('Enter addresses.');
    setLoading(true); setAllRoutes(null); setCurrentRoute(null); setWeather(null); setRecommendation(null);
    try {
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
      } else alert("No routes found.");
    } catch (e) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
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

  const selectRoute = (type) => { if (allRoutes && allRoutes[type]) setCurrentRoute(allRoutes[type]); };
  const getAqiColor = (aqi) => { if(aqi <= 2) return "#00cc66"; if(aqi === 3) return "#ff9933"; return "#cc0000"; };

  return (
    <div className="app-container">
      {/* TOP BAR */}
      <div className="top-bar">
        <div className="input-row">
            <input type="text" value={startAddress} onChange={(e) => setStartAddress(e.target.value)} placeholder="Start Location" />
            <button onClick={handleUseCurrentLocation} className="icon-btn">📍</button>
        </div>
        <div className="input-row">
            <input type="text" value={endAddress} onChange={(e) => setEndAddress(e.target.value)} placeholder="Destination" />
        </div>
      </div>

      {/* MAP AREA */}
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
                        🌡️ {weather.temperature}°C  | 💨 AQI: {weather.aqi}
                    </div>
                </div>
            </div>
        )}

        <button className="legend-btn" onClick={() => setShowLegend(!showLegend)}>?</button>
        {showLegend && (
            <div className="legend-box" onClick={() => setShowLegend(false)}>
                 <h4 style={{margin:'0 0 8px 0'}}>Map Guide</h4>
                 <div className="legend-item"><span className="color-dot" style={{background:'#00cc66'}}></span> Safe</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#ff9933'}}></span> Moderate</div>
                 <div className="legend-item"><span className="color-dot" style={{background:'#ff4d4d'}}></span> High Risk</div>
            </div>
        )}

        {/* MAP CONTAINER - Added key to force refresh */}
        <MapContainer 
            key={currentRoute ? currentRoute.summary.distance : "default"} 
            center={defaultCenter} 
            zoom={13} 
            zoomControl={false}
        >
            {/* UPDATED TILE LAYER (Better looking map) */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {/* 1. AUTO ZOOM */}
            {currentRoute && <FitBounds route={currentRoute} />}

            {/* 2. ROUTE LINE */}
            {currentRoute && routeLine.length > 0 && (
                <>
                    <Polyline positions={routeLine} color={currentRoute.safety.color} weight={6} />
                    <RouteArrows positions={routeLine} />
                </>
            )}

            {/* 3. START & END MARKERS (Always visible if coords exist) */}
            {startCoords && (
                <Marker position={startCoords} icon={startIcon}>
                    <Popup>Start: {startAddress}</Popup>
                </Marker>
            )}
            {destCoords && (
                <Marker position={destCoords} icon={destIcon}>
                    <Popup>End: {endAddress}</Popup>
                </Marker>
            )}

            {isNavigating && currentLocation && (
                <> <Marker position={currentLocation} icon={carIcon}><Popup>You</Popup></Marker> <RecenterMap position={currentLocation} /> </>
            )}
        </MapContainer>
      </div>

      {/* BOTTOM BAR */}
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