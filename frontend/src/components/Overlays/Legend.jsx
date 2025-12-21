import React, { useState } from 'react';

const Legend = () => {
    const [show, setShow] = useState(false);

    return (
        <>
            <button className="legend-btn" onClick={() => setShow(!show)}>?</button>
            {show && (
                <div className="legend-box" onClick={() => setShow(false)}>
                    <h4 style={{margin: '0 0 10px 0'}}>🗺️ Map Guide</h4>
                    
                    <div className="legend-row">
                        <span className="line-sample safe"></span> Safe Route (AI)
                    </div>
                    <div className="legend-row">
                        <span className="line-sample fast"></span> Fast Route
                    </div>
                    <hr style={{border: '0', borderTop: '1px solid #eee', margin: '8px 0'}}/>
                    <div className="legend-row">
                        <span className="dot safe"></span> Low Risk (0-40)
                    </div>
                    <div className="legend-row">
                        <span className="dot moderate"></span> Medium (41-75)
                    </div>
                    <div className="legend-row">
                        <span className="dot high"></span> High Risk (76+)
                    </div>
                </div>
            )}
        </>
    );
};

export default Legend;