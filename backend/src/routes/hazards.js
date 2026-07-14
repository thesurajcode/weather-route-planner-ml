import express from "express";
import HazardReport from "../models/HazardReport.js";

const router = express.Router();

/**
 * ✅ POST /api/hazards/report
 * Add a new hazard report
 */
router.post("/report", async (req, res) => {
  try {
    const { lat, lon, type, severity } = req.body;

    if (!lat || !lon || !type) {
      return res.status(400).json({ error: "Invalid hazard data" });
    }

    const report = await HazardReport.create({
      lat,
      lon,
      type,
      severity
    });

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ GET /api/hazards
 * Fetch all hazard reports (for map display)
 */
router.get("/", async (req, res) => {
  try {
    const hazards = await HazardReport.find()
      .sort({ createdAt: -1 })
      .limit(200); // safety limit

    res.json(hazards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
