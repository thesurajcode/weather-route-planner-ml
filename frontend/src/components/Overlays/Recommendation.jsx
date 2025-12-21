import React from 'react';
import { useApp } from '../../context/AppContext';

const Recommendation = () => {
    const { routeData } = useApp();
    if (!routeData || !routeData.recommendation) return null;

    const { recommendation } = routeData;
    const isWait = recommendation.shouldWait;

    return (
        <div className={`recommendation-pill ${isWait ? 'wait' : 'go'}`}>
            {recommendation.text}
        </div>
    );
};

export default Recommendation;