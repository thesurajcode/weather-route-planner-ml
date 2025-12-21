import React from 'react';
import { useApp } from '../../context/AppContext';

const ReportButton = ({ onToggle }) => {
    const { isNavigating } = useApp();
    if (!isNavigating) return null;

    return (
        <button className="report-btn" onClick={onToggle}>⚠️</button>
    );
};

export default ReportButton;