// backend/src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // Allows frontend to communicate with backend
app.use(express.json());

const apiRoutes = require('./api/routes');
app.use('/api', apiRoutes);

module.exports = app;