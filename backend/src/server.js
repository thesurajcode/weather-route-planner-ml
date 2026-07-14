import hazardRoutes from "./routes/hazards.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routeRoutes from "./routes/route.js";

/* --------------------------------------------------
   ✅ FIX: Proper .env loading for ESM + Windows
-------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root
dotenv.config({ path: path.join(__dirname, "../.env") });

/* --------------------------------------------------
   App setup
-------------------------------------------------- */
const app = express();
app.use(cors());
app.use(express.json());

/* --------------------------------------------------
   ✅ ENV DEBUG (keep for now, remove later)
-------------------------------------------------- */
console.log("ENV CHECK:", {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? "✔ loaded" : "❌ missing",
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY ? "✔ loaded" : "❌ missing",
  OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY ? "✔ loaded" : "❌ missing"
});

/* --------------------------------------------------
   MongoDB
-------------------------------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

/* --------------------------------------------------
   Routes
-------------------------------------------------- */
app.use("/api/routes", routeRoutes);
app.use("/api/hazards", hazardRoutes); // ✅ ADD THIS

/* --------------------------------------------------
   Server start
-------------------------------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
