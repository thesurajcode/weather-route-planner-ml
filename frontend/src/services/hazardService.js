import api from './api';

export const getHazards = async () => {
    try {
        const response = await api.get('/hazards');
        return response.data;
    } catch (error) {
        console.error("Fetch Hazards Error:", error);
        return [];
    }
};

export const reportHazard = async (type, lat, lon) => {
    try {
        const response = await api.post('/report-hazard', {
            latitude: lat,
            longitude: lon,
            hazardType: type,
            description: "User Reported"
        });
        return response.ok || response.status === 200;
    } catch (error) {
        console.error("Report Hazard Error:", error);
        return false;
    }
};