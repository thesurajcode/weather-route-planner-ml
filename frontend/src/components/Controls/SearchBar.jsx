import React, { useState } from 'react';
import axios from 'axios';
// ✅ FIX: Go up TWO levels (../../)
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

    const handleSearch = () => {
        if (!startAddress || !endAddress) {
            alert("Please enter both Start and End locations.");
            return;
        }
        fetchRoute(startAddress, endAddress);
    };

    return (
        <div className="top-bar" style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <div className="input-group" style={{ flex: 1, display: 'flex' }}>
                <input 
                    type="text" 
                    value={startAddress} 
                    onChange={(e) => setStartAddress(e.target.value)} 
                    placeholder="Start Location" 
                    style={{ flex: 1, padding: '10px' }}
                />
                <button onClick={handleCurrentLocation} style={{ padding: '0 15px' }}>📍</button>
            </div>

            <div className="input-group" style={{ flex: 1 }}>
                <input 
                    type="text" 
                    value={endAddress} 
                    onChange={(e) => setEndAddress(e.target.value)} 
                    placeholder="Destination" 
                    style={{ width: '100%', padding: '10px' }}
                />
            </div>

            <div className="action-group">
                {!isNavigating ? (
                    <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Get Route 🚀
                    </button>
                ) : (
                    <button onClick={resetNavigation} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        ❌ Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;