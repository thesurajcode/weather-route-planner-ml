import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getHazards } from '../services/hazardService';

// Components
import MapContainer from '../components/Map/MapContainer';
import SearchBar from '../components/Controls/SearchBar';
import RouteSelector from '../components/Controls/RouteSelector';
import ActionButtons from '../components/Controls/ActionButtons';
import WeatherHUD from '../components/Overlays/WeatherHUD'; // The new Dashboard Box
import Recommendation from '../components/Overlays/Recommendation';
import Legend from '../components/Overlays/Legend';
import ReportButton from '../components/Hazards/ReportButton';
import ReportMenu from '../components/Hazards/ReportMenu';

const Home = () => {
    const { setHazards } = useApp();
    const [showReportMenu, setShowReportMenu] = useState(false);

    // Load Hazards on Mount
    useEffect(() => {
        getHazards().then(data => setHazards(data));
    }, [setHazards]);

    return (
        <div className="app-container">
            {/* 1. Top Bar (Search + Advice) */}
            <div className="ui-layer top">
                <SearchBar />
                <Recommendation />
            </div>

            {/* 2. The New Flight Deck (Speed/Weather) - Top Right */}
            <div className="ui-layer float-right">
                <WeatherHUD />
            </div>

            {/* 3. The Map (Background) */}
            <div className="map-wrapper">
                <MapContainer />
            </div>

            {/* 4. Bottom Left (Legend) */}
            <div className="ui-layer bottom-left">
                <Legend />
            </div>

            {/* 5. Bottom Controls (Buttons) */}
            <div className="ui-layer bottom">
                <RouteSelector />
                <ActionButtons />
            </div>

            {/* 6. Hazard Reporting - Bottom Right */}
            <div className="ui-layer float-bottom-right">
                <ReportButton onToggle={() => setShowReportMenu(!showReportMenu)} />
                {showReportMenu && <ReportMenu onClose={() => setShowReportMenu(false)} />}
            </div>
        </div>
    );
};

export default Home;