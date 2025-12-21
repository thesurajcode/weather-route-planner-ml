import pandas as pd
import numpy as np
import random
import os
from datetime import datetime, timedelta

# --- CONFIGURATION ---
ROW_COUNT = 1500  # Generate 1500 rows for better training
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'data', 'processed', 'delhi_traffic_data.csv')

# --- REAL DELHI LOCATIONS ---
# We map specific areas to their road types
LOCATIONS = [
    {"name": "Noida-Greater Noida Expressway", "type": "Highway"},
    {"name": "Delhi-Gurgaon Expressway", "type": "Highway"},
    {"name": "DND Flyway", "type": "Highway"},
    {"name": "Outer Ring Road (Nehru Place)", "type": "Highway"},
    {"name": "Connaught Place Outer Circle", "type": "City"},
    {"name": "Chandni Chowk Main Road", "type": "City"},
    {"name": "Lajpat Nagar Market Rd", "type": "City"},
    {"name": "Hauz Khas Village Rd", "type": "City"},
    {"name": "Najafgarh-Dhansa Road", "type": "Rural"},
    {"name": "Bawana Industrial Area", "type": "Rural"},
    {"name": "Chhatarpur Farm Road", "type": "Rural"}
]

WEATHER_TYPES = ['Clear', 'Rain', 'Fog', 'Stormy']
TRAFFIC_TYPES = ['Low', 'Medium', 'High']

def generate_severity(row):
    """
    The 'Logic' Function: Calculates risk score (1-10) based on conditions.
    This creates the patterns the ML model will learn.
    """
    score = 1  # Base score (Safe)
    
    # 1. Weather Impact
    if row['Weather_Condition'] == 'Rain': score += 3
    if row['Weather_Condition'] == 'Fog': score += 4
    if row['Weather_Condition'] == 'Stormy': score += 5
    
    # 2. Road Type Impact
    if row['Road_Type'] == 'Highway': score += 2  # High speed = higher risk
    if row['Road_Type'] == 'Rural' and row['Weather_Condition'] in ['Fog', 'Stormy']:
        score += 3  # Dangerous: Rural roads have poor lighting
        
    # 3. Traffic Impact
    if row['Traffic_Density'] == 'High': score += 1
    
    # 4. Random Noise (Real life is unpredictable)
    noise = random.randint(-1, 2)
    score += noise
    
    # Clamp score between 1 and 10
    return max(1, min(10, score))

# --- GENERATION LOOP ---
data = []
current_date = datetime(2023, 1, 1)

print(f"🔄 Generating {ROW_COUNT} rows of synthetic Delhi data...")

for _ in range(ROW_COUNT):
    # Pick random attributes
    loc = random.choice(LOCATIONS)
    weather = random.choice(WEATHER_TYPES)
    traffic = random.choice(TRAFFIC_TYPES)
    
    # Determine Surface Condition
    surface = "Dry"
    if weather in ['Rain', 'Stormy']: surface = "Wet"
    if weather == 'Fog': surface = "Damp"
    
    # Create Row
    row = {
        "Date": current_date.strftime("%Y-%m-%d"),
        "Time": f"{random.randint(0, 23):02d}:00",
        "Area_Name": loc["name"],
        "Road_Type": loc["type"],
        "Weather_Condition": weather,
        "Surface_Condition": surface,
        "Traffic_Density": traffic
    }
    
    # Calculate Target Variable (Severity)
    row["Accident_Severity"] = generate_severity(row)
    
    data.append(row)
    current_date += timedelta(minutes=random.randint(30, 120))

# --- SAVE TO CSV ---
df = pd.DataFrame(data)

# Ensure directory exists
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

df.to_csv(OUTPUT_PATH, index=False)
print(f"✅ Success! Data saved to: {OUTPUT_PATH}")
print(df.head())