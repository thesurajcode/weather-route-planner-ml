import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load crash zone data safely
const ZONE_FILE = path.join(__dirname, "../data/dtp_crash_zones_2021.json");
const zones = JSON.parse(fs.readFileSync(ZONE_FILE, "utf-8"));

/**
 * Haversine distance (meters)
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute crash-zone penalty for a route
 */
export function getZonePenalty(routeGeometry) {
  const hitZones = new Set();

  for (const [lat, lon] of routeGeometry) {
    for (const z of zones) {
      const d = haversine(lat, lon, z.lat, z.lon);
      if (d <= z.radius) {
        hitZones.add(z.id);
      }
    }
  }

  const count = hitZones.size;

  // Conservative penalty (research-safe)
  const penalty = count * 15;

  return {
    penalty,
    count,
    zones: Array.from(hitZones)
  };
}
