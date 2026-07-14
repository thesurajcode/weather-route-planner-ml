import pickle
import pandas as pd
from sklearn.metrics import mean_absolute_error, accuracy_score
from sklearn.model_selection import train_test_split
import os

# ---------------- PATHS ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "../data/processed/delhi_traffic_data.csv")
MODELS_DIR = os.path.join(BASE_DIR, "../models")

MODEL_PATH = os.path.join(MODELS_DIR, "risk_model.pkl")
ENCODER_PATH = os.path.join(MODELS_DIR, "encoders.pkl")

# ---------------- LOAD DATA ----------------
data = pd.read_csv(DATA_PATH)

# Rename columns to match training
data = data.rename(columns={
    "Weather_Condition": "weather",
    "Road_Type": "road_type",
    "Surface_Condition": "surface",
    "Accident_Severity": "severity"
})

# ---------------- LOAD MODEL & ENCODERS ----------------
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

with open(ENCODER_PATH, "rb") as f:
    encoders = pickle.load(f)

le_weather = encoders["weather"]
le_road = encoders["road"]
le_surface = encoders["surface"]

# ---------------- SAFE ENCODING ----------------
def safe_transform(encoder, series):
    return series.apply(
        lambda x: encoder.transform([x])[0]
        if x in encoder.classes_
        else encoder.transform([encoder.classes_[0]])[0]
    )

data["Weather_Code"] = safe_transform(le_weather, data["weather"])
data["Road_Code"] = safe_transform(le_road, data["road_type"])
data["Surface_Code"] = safe_transform(le_surface, data["surface"])

# ---------------- FEATURES ----------------
X = data[["Weather_Code", "Road_Code", "Surface_Code"]]
y = data["severity"]

# ---------------- TRAIN / TEST SPLIT ----------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ---------------- EVALUATION ----------------
y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
acc = accuracy_score(y_test, y_pred.round())

print("✅ Model Evaluation Results")
print(f"Mean Absolute Error (MAE): {mae:.2f}")
print(f"Severity Classification Accuracy: {acc*100:.2f}%")
