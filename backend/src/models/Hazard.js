const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  hazardType: { 
    type: String, 
    required: true,
    enum: ['Accident', 'Fog', 'Flooding', 'Pothole', 'Construction', 'Police', 'Traffic', 'Traffic Jam', 'Other'] 
  },
  description: { type: String },
  reportedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hazard', hazardSchema);