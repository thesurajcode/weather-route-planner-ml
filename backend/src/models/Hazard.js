const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  hazardType: {
    type: String,
    required: true,
    enum: ['Accident', 'Fog', 'Flooding', 'Pothole', 'Construction', 'Other'] // The types of risks
  },
  description: {
    type: String,
    required: false
  },
  reportedAt: {
    type: Date,
    default: Date.now // Automatically sets the time
  }
});

module.exports = mongoose.model('Hazard', hazardSchema);