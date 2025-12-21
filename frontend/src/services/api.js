import axios from 'axios';

// ✅ SMART SWITCH:
// If running locally, talk to localhost:5001 (or 10000)
// If deployed, talk to the Render Cloud Backend automatically.
const BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api'  // Connects to local backend if running locally
    : 'https://route-safety-backend.onrender.com/api'; // Connects to cloud if deployed

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

export default api;