import React from 'react';
import { useApp } from '../../context/AppContext';

const ActionButtons = () => {
    const { isNavigating, isDriving, setIsDriving, resetNavigation } = useApp();

    if (!isNavigating) return null;

    return (
        <div className="action-buttons-container">
            <button 
                onClick={() => setIsDriving(!isDriving)} 
                className={`drive-btn ${isDriving ? 'active' : ''}`}
            >
                {isDriving ? '🛑 Stop Drive' : '🚗 Start Drive'}
            </button>
            
            <button onClick={resetNavigation} className="reset-btn">
                🔄 New Search
            </button>
        </div>
    );
};

export default ActionButtons;