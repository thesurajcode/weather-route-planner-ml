import mongoose from "mongoose";

const HazardReportSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  type: {
    type: String,
    enum: ["ACCIDENT", "POTHOLE", "FOG", "WATER_LOGGING", "TRAFFIC"],
    required: true
  },
  severity: {
    type: Number, // 1–5 (user reported)
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // ⏱ auto-delete after 7 days
  }
});

export default mongoose.model("HazardReport", HazardReportSchema);
