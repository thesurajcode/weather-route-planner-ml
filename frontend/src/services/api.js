import axios from 'axios';

const api = axios.create({
  // Point to your deployed backend URL
  baseURL: 'https://route-safety-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;