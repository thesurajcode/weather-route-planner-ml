const ML_API_URL = "http://127.0.0.1:5001/predict";

export async function getRiskFromML({ weather, road_type, surface }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

  try {
    const res = await fetch(ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        weather,
        road_type,
        surface
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`ML service error: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("⏱ ML request timed out");
    } else {
      console.warn("⚠️ ML fetch error:", error.message);
    }
    throw new Error("fetch failed");
  }
}
