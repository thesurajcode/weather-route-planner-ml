import React from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext';

const SearchBar = () => {
    // ✅ Get fetchRoute from context
    const { 
        startAddress, setStartAddress, 
        endAddress, setEndAddress, 
        setStartCoords, 
        fetchRoute, // This is the function that calls the backend
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
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                const response = await axios.get(url);
                const addr = response.data.address;
                
                // Smart Address Formatting
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

    // ✅ This function triggers the backend call
    const handleSearch = () => {
        if (!startAddress || !endAddress) {
            alert("Please enter both Start and End locations.");
            return;
        }
        fetchRoute(startAddress, endAddress);
    };

    return (
        <div className="top-bar">
            {/* Start Input */}
            <div className="input-group">
                <input 
                    type="text" 
                    value={startAddress} 
                    onChange={(e) => setStartAddress(e.target.value)} 
                    placeholder="Start Location" 
                />
                <button onClick={handleCurrentLocation} className="icon-btn" title="Use My Location">📍</button>
            </div>

            {/* Destination Input */}
            <div className="input-group">
                <input 
                    type="text" 
                    value={endAddress} 
                    onChange={(e) => setEndAddress(e.target.value)} 
                    placeholder="Destination" 
                />
            </div>

            {/* ✅ GET ROUTE BUTTON */}
            <div className="action-group">
                {!isNavigating ? (
                    <button className="get-route-btn" onClick={handleSearch}>
                        Get Route 🚀
                    </button>
                ) : (
                    <button className="reset-btn" onClick={resetNavigation}>
                        ❌ Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;