import pandas as pd
import numpy as np
import random
import os

# Configuration
NUM_SAMPLES = 25000
# Coordinates for Delhi NCR (approximate bounding box)
DELHI_LAT_RANGE = (28.40, 28.88)
DELHI_LON_RANGE = (76.84, 77.34)

# Factors affecting risk
weather_conditions = ['Clear', 'Rain', 'Fog', 'Clouds', 'Drizzle', 'Thunderstorm']
road_types = ['Highway', 'City Street', 'Residential', 'Intersection', 'Market Area']
times_of_day = ['Morning', 'Afternoon', 'Evening', 'Night', 'Late Night']

print("🚀 Starting Synthetic Data Generation for Delhi...")

data = []

for _ in range(NUM_SAMPLES):
    # 1. Random Location
    lat = random.uniform(*DELHI_LAT_RANGE)
    lon = random.uniform(*DELHI_LON_RANGE)

    # 2. Random Factors
    weather = random.choice(weather_conditions)
    road = random.choice(road_types)
    time = random.choice(times_of_day)

    # 3. Logic for Risk Calculation (The "Rules" of the World)
    base_risk = random.randint(5, 20)
    
    # Weather Risk
    if weather == 'Rain': base_risk += 30
    elif weather == 'Thunderstorm': base_risk += 50
    elif weather == 'Fog': base_risk += 40
    elif weather == 'Drizzle': base_risk += 15

    # Time Risk
    if time == 'Night' or time == 'Late Night': base_risk += 25
    elif time == 'Evening': base_risk += 15 # Rush hour

    # Road Risk
    if road == 'Intersection': base_risk += 20
    elif road == 'Highway': base_risk += 15
    
    # Add some randomness (noise)
    final_score = base_risk + random.randint(-5, 15)
    
    # Cap between 0 and 100
    final_score = max(0, min(100, final_score))

    # Assign Severity Label
    if final_score > 75: severity = 2      # High Risk
    elif final_score > 40: severity = 1    # Moderate Risk
    else: severity = 0                     # Low Risk

    data.append([lat, lon, weather, road, time, final_score, severity])

# Convert to DataFrame
cols = ['latitude', 'longitude', 'weather', 'road_type', 'time_of_day', 'risk_score', 'severity']
df = pd.DataFrame(data, columns=cols)

# Save
output_path = os.path.join('data', 'processed', 'accidents_delhi.csv')
df.to_csv(output_path, index=False)

print(f"✅ Generated {NUM_SAMPLES} records.")
print(f"📂 Saved to: {output_path}")
print(df.head())