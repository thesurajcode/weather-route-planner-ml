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
            alert("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setStartCoords(`${latitude},${longitude}`);
            try {
                // Reverse Geocoding for current location
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                const response = await axios.get(url);
                setStartAddress(response.data.display_name.split(',').slice(0, 2).join(','));
            } catch (e) { setStartAddress(`${latitude}, ${longitude}`); }
        });
    };

    return (
        <div className="search-bar-container">
            <div className="input-box">
                <input 
                    type="text" value={startAddress} 
                    onChange={(e) => setStartAddress(e.target.value)} 
                    placeholder="Starting Location" 
                />
                <button onClick={handleCurrentLocation} title="Use My Location">📍</button>
            </div>
            <div className="input-box">
                <input 
                    type="text" value={endAddress} 
                    onChange={(e) => setEndAddress(e.target.value)} 
                    placeholder="Destination" 
                />
            </div>
            <div className="button-group">
                {!isNavigating ? (
                    <button className="btn-primary" onClick={() => fetchRoute(startAddress, endAddress)}>
                        Get Route 🚀
                    </button>
                ) : (
                    <button className="btn-danger" onClick={resetNavigation}>Clear</button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;