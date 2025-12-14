// backend/src/app.js
const express = require('express');
const cors = require('cors');
const router = require('./api/routes'); // Import your routes

const app = express();

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Allow JSON data

// Routes
app.use('/api', router);

// Health Check (Optional)
app.get('/', (req, res) => {
  res.send('Route Safety Backend is Running!');
});

module.exports = app;