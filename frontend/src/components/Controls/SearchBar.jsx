import React from 'react';
import axios from 'axios'; // Ensure you have axios installed
import { useApp } from '../../context/AppContext';

const SearchBar = () => {
    // We don't need reverseGeocode import anymore, we will do it better here.
    const { startAddress, setStartAddress, endAddress, setEndAddress, setStartCoords } = useApp();

    const handleCurrentLocation = () => {
        setStartAddress("Locating...");

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            setStartAddress("");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // 1. Set the coordinates for the backend
            setStartCoords(`${latitude},${longitude}`);

            try {
                // 2. Call Nominatim (OpenStreetMap) directly for full details
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                const response = await axios.get(url);
                const addr = response.data.address;

                // 3. SMART FORMATTING: Create a detailed string
                // It looks for: "Street Name, Area Name, City Name"
                const detailedAddress = [
                    addr.road || addr.pedestrian || addr.building, // Street
                    addr.suburb || addr.neighbourhood || addr.residential, // Area
                    addr.city || addr.town || addr.village // City
                ].filter(Boolean).join(', '); // Joins with commas, removes empty parts

                // 4. Update the input box
                setStartAddress(detailedAddress || "Unknown Location");

            } catch (error) {
                console.error("Address Error:", error);
                setStartAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
        }, (err) => {
            console.error("GPS Error:", err);
            setStartAddress("");
            alert("Could not get location.");
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
                <button onClick={handleCurrentLocation} className="icon-btn" title="Use My Location">📍</button>
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