import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

# --- PATHS ---
BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'delhi_traffic_data.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# --- 1. LOAD DATA ---
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"❌ Data file not found at {DATA_PATH}. Run generate_data.py first!")

print("📊 Loading Data...")
df = pd.read_csv(DATA_PATH)

# --- 2. PREPROCESSING ---
# We need to turn words (Rain, Highway) into numbers for the AI
le_weather = LabelEncoder()
le_road = LabelEncoder()
le_surface = LabelEncoder()

print("⚙️ Encoding Features...")
df['Weather_Code'] = le_weather.fit_transform(df['Weather_Condition'])
df['Road_Code'] = le_road.fit_transform(df['Road_Type'])
df['Surface_Code'] = le_surface.fit_transform(df['Surface_Condition'])

# Features (Inputs) and Target (Output)
X = df[['Weather_Code', 'Road_Code', 'Surface_Code']]
y = df['Accident_Severity']

# --- 3. TRAIN MODEL ---
print("🧠 Training Random Forest Model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# --- 4. SAVE ARTIFACTS ---
# We save the Model AND the Encoders (so we know that 0='Clear' and 1='Rain')
os.makedirs(MODEL_DIR, exist_ok=True)

model_path = os.path.join(MODEL_DIR, 'risk_model.pkl')
encoders_path = os.path.join(MODEL_DIR, 'encoders.pkl')

with open(model_path, 'wb') as f:
    pickle.dump(model, f)

with open(encoders_path, 'wb') as f:
    pickle.dump({
        'weather': le_weather,
        'road': le_road,
        'surface': le_surface
    }, f)

print(f"✅ Model saved to: {model_path}")
print(f"✅ Encoders saved to: {encoders_path}")