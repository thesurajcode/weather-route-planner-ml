const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 10000; // Render uses port 10000

// FIX: Use the Environment Variable first. Only use localhost if that is missing.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safe_route_db';

console.log("Attempting to connect to database...");

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    
    // Only start the server if DB connects
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });