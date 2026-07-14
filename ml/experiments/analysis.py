import requests
import csv
import time

BACKEND_URL = "http://localhost:5000/api/routes"

ROUTES = [
    ("India Gate", "Sarita Vihar"),
    ("Connaught Place", "Noida Sector 18"),
    ("IIT Delhi", "Gurugram Cyber Hub"),
    ("AIIMS Delhi", "Faridabad"),
    ("Karol Bagh", "Rajouri Garden"),
]

OUTPUT_FILE = "experiment_results.csv"

def fetch_best_route(start, end, mode):
    params = {
        "start": start,
        "end": end,
        "mode": mode
    }
    res = requests.get(BACKEND_URL, params=params)
    res.raise_for_status()
    return res.json()["routes"][0]

def main():
    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.writer(f)

        writer.writerow([
            "route_id",
            "start",
            "end",
            "mode",
            "distance_km",
            "duration_min",
            "risk_score",
            "ml_risk",
            "zone_count",
            "hazard_count",
            "weather",
            "aqi"
        ])

        for i, (start, end) in enumerate(ROUTES, 1):
            for mode in ["fast", "safe"]:
                route = fetch_best_route(start, end, mode)

                writer.writerow([
                    f"R{i}",
                    start,
                    end,
                    mode,
                    round(route["distance"] / 1000, 2),
                    round(route["duration"] / 60, 2),
                    route.get("riskScore"),
                    route.get("debug", {}).get("mlRisk", 0),
                    route.get("debug", {}).get("zoneCount", 0),
                    route.get("debug", {}).get("hazardCount", 0),
                    route["weather"]["condition"],
                    route["weather"]["aqi"]
                ])

                print(f"✔ Collected {start} → {end} [{mode}]")
                time.sleep(2)

if __name__ == "__main__":
    main()
