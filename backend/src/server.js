// backend/src/server.js
const axios = require('axios');

const app = require('./app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});