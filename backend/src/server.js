require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Middleware
app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:5173",                     // Vite Local
        "http://localhost:3000",                     // CRA Local
        "https://route-safety-frontend.onrender.com" // Deployed Frontend
    ],
    credentials: true
}));

// 2. Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safe_route_db';
console.log("Attempting to connect to database...");

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 3. API Routes
app.use('/api', routes);

// 4. Basic Health Check
app.get('/', (req, res) => {
    res.send('✅ Route Safety Backend is Running!');
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});