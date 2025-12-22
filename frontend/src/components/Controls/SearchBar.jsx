import React from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext';

const SearchBar = () => {
    const { 
        startAddress, setStartAddress, 
        endAddress, setEndAddress, 
        setStartCoords, 
        fetchRoute, 
        isNavigating, resetNavigation 
    } = useApp();

    const handleCurrentLocation = () => {
        setStartAddress("Locating...");
        if (!navigator.geolocation) {
            alert("Geolocation is not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setStartCoords(`${latitude},${longitude}`);

            try {
                // Reverse Geocoding to get the street name
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                const response = await axios.get(url);
                const addr = response.data.address;
                
                const detailedAddress = [
                    addr.road || addr.pedestrian,
                    addr.suburb || addr.neighbourhood,
                    addr.city || addr.town
                ].filter(Boolean).join(', ');

                setStartAddress(detailedAddress || "My Location");
            } catch (error) {
                setStartAddress(`${latitude}, ${longitude}`);
            }
        }, () => setStartAddress("Location Error"));
    };

    return (
        <div className="search-flex-row">
            <div className="input-with-icon">
                <input 
                    type="text" 
                    value={startAddress} 
                    onChange={(e) => setStartAddress(e.target.value)} 
                    placeholder="Starting point" 
                />
                <button onClick={handleCurrentLocation} className="loc-btn">📍</button>
            </div>

            <div className="input-simple">
                <input 
                    type="text" 
                    value={endAddress} 
                    onChange={(e) => setEndAddress(e.target.value)} 
                    placeholder="Destination" 
                />
            </div>

            <div className="button-area">
                {!isNavigating ? (
                    <button 
                        onClick={() => fetchRoute(startAddress, endAddress)} 
                        className="btn-get-route"
                    >
                        Get Route 🚀
                    </button>
                ) : (
                    <button onClick={resetNavigation} className="btn-clear">
                        Clear ❌
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;