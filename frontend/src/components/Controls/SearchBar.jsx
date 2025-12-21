import React from 'react';
import { useApp } from '../../context/AppContext';
import { reverseGeocode } from '../../services/routeService';

const SearchBar = () => {
    const { startAddress, setStartAddress, endAddress, setEndAddress, setStartCoords } = useApp();

    const handleCurrentLocation = () => {
        setStartAddress("Locating...");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setStartCoords(`${latitude},${longitude}`);
            const address = await reverseGeocode(latitude, longitude);
            setStartAddress(address);
        });
    };

    return (
        <div className="top-bar">
            <div className="input-group">
                <input 
                    type="text" 
                    value={startAddress} 
                    onChange={(e) => setStartAddress(e.target.value)} 
                    placeholder="Start Location" 
                />
                <button onClick={handleCurrentLocation} className="icon-btn">📍</button>
            </div>
            <div className="input-group">
                <input 
                    type="text" 
                    value={endAddress} 
                    onChange={(e) => setEndAddress(e.target.value)} 
                    placeholder="Destination" 
                />
            </div>
        </div>
    );
};

export default SearchBar;