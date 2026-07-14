import { useState } from "react";
import { fetchRoutes } from "../api/routesApi";
import MapView from "../components/MapView";

export default function Home() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFindRoutes = async () => {
    if (!start || !end) {
      setError("Please enter both locations");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchRoutes(start, end);
      setRoutes(data.routes);
    } catch (err) {
      setError("Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🌦️ Weather Safe Route Planner</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Start location"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="text"
          placeholder="Destination"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button onClick={handleFindRoutes}>
          {loading ? "Loading..." : "Find Routes"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {routes.length > 0 && <MapView routes={routes} />}
    </div>
  );
}
