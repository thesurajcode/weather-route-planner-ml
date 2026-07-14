import axios from "axios";

export async function getRoutes(start, end, mode) {
  const res = await axios.get("http://localhost:5000/api/routes", {
    params: { start, end, mode }
  });

  return res.data.routes;
}
