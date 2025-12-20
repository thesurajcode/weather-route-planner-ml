const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5001;

// MongoDB Connection String (Local Database)
// If you are using MongoDB Atlas (Cloud), replace this URL with your connection string.
const MONGO_URI = 'mongodb://localhost:27017/safe_route_db'; 

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