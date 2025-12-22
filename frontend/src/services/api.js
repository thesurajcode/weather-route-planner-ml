import axios from 'axios';

const api = axios.create({
  // ✅ Replace with your actual Render backend URL
  baseURL: 'https://route-safety-backend.onrender.com/api', 
});

export default api;