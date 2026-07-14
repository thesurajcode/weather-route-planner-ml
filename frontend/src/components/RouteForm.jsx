import { useState } from "react";
import { getRoutes } from "../api/routesApi";

function RouteForm({ setRoutes, mode }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const routes = await getRoutes(start, end, mode);
      console.log("📦 Routes received:", routes);
      setRoutes(routes);
    } catch (err) {
      console.error("❌ Route fetch error", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="route-form">
      <input
        placeholder="Start location"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
      <input
        placeholder="End location"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />
      <button type="submit">
        Get {mode === "safe" ? "Safe" : "Fast"} Route
      </button>
    </form>
  );
}

export default RouteForm;
