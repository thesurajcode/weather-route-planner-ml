import axios from 'axios';

const api = axios.create({
  // This points to your Node.js backend on Render
  baseURL: 'https://route-safety-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;