import { useMapEvents, Popup } from 'react-leaflet';
// ... existing imports

const MapContainer = () => {
    const { currentRoute, startCoords, hazards } = useApp();
    const [reportPos, setReportPos] = useState(null);

    // Sub-component to handle map clicks
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                setReportPos(e.latlng);
            },
        });
        return null;
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <LeafletMap center={[28.6139, 77.2090]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapEvents />
                
                {/* Show Report Menu on Click */}
                {reportPos && (
                    <Popup position={reportPos} onClose={() => setReportPos(null)}>
                        <ReportMenu position={reportPos} onClose={() => setReportPos(null)} />
                    </Popup>
                )}

                {currentRoute && <RouteLayer routes={currentRoute.routes} />}
                <HazardMarkers />
            </LeafletMap>
        </div>
    );
};