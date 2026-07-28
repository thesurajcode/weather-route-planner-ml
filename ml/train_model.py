import pandas as pd
import pickle
import os
import numpy as np

from sklearn.model_selection import (
    train_test_split,
    cross_validate,
    KFold
)
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    classification_report,
    confusion_matrix
)

# -----------------------------
# PATHS
# -----------------------------
BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'delhi_traffic_data.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# -----------------------------
# 1. LOAD DATA
# -----------------------------
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"❌ Data file not found at {DATA_PATH}. Run generate_data.py first!"
    )

print("📊 Loading Data...")
df = pd.read_csv(DATA_PATH)

print("Dataset Shape:", df.shape)

# -----------------------------
# 2. PREPROCESSING
# -----------------------------
print("⚙️ Encoding Features...")

le_weather = LabelEncoder()
le_road = LabelEncoder()
le_surface = LabelEncoder()

df["Weather_Code"] = le_weather.fit_transform(df["Weather_Condition"])
df["Road_Code"] = le_road.fit_transform(df["Road_Type"])
df["Surface_Code"] = le_surface.fit_transform(df["Surface_Condition"])

# Features and Target
X = df[["Weather_Code", "Road_Code", "Surface_Code"]]
y = df["Accident_Severity"]

print("Target Range:", y.min(), "to", y.max())

# -----------------------------
# 3. TRAIN-TEST SPLIT
# -----------------------------
print("🔀 Splitting Data (80-20)...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training Size:", X_train.shape[0])
print("Testing Size:", X_test.shape[0])

# -----------------------------
# 4. TRAIN MODEL
# -----------------------------
print("🧠 Training Random Forest Model...")

model = RandomForestRegressor(
    n_estimators=100,
    max_depth=None,
    random_state=42
)

model.fit(X_train, y_train)

# -----------------------------
# 5. REGRESSION EVALUATION
# -----------------------------
print("📈 Evaluating Regression Performance...")

y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\n========== Regression Metrics ==========")
print("MAE      :", round(mae, 4))
print("RMSE     :", round(rmse, 4))
print("R2 Score :", round(r2, 4))

# -----------------------------
# 5A. CROSS VALIDATION
# -----------------------------
print("\n🔁 Running 5-Fold Cross Validation...")

cv = KFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

scores = cross_validate(
    model,
    X,
    y,
    cv=cv,
    scoring={
        "mae": "neg_mean_absolute_error",
        "rmse": "neg_root_mean_squared_error",
        "r2": "r2"
    },
    n_jobs=-1,
    return_train_score=False
)

mae_scores = -scores["test_mae"]
rmse_scores = -scores["test_rmse"]
r2_scores = scores["test_r2"]

print("\n========== Cross Validation Results ==========")

print("MAE per Fold :",
      [round(x, 4) for x in mae_scores])

print("RMSE per Fold:",
      [round(x, 4) for x in rmse_scores])

print("R² per Fold  :",
      [round(x, 4) for x in r2_scores])

print("\nAverage Performance")

print(f"MAE  : {mae_scores.mean():.4f} ± {mae_scores.std():.4f}")
print(f"RMSE : {rmse_scores.mean():.4f} ± {rmse_scores.std():.4f}")
print(f"R²   : {r2_scores.mean():.4f} ± {r2_scores.std():.4f}")

# -----------------------------
# 6. CLASSIFICATION EVALUATION
# -----------------------------
print("\n📊 Evaluating Classification Performance...")

def categorize(severity):
    if severity <= 3:
        return "Low"
    elif severity <= 7:
        return "Medium"
    else:
        return "High"

y_test_cat = [categorize(y) for y in y_test]
y_pred_cat = [categorize(y) for y in y_pred]

accuracy = accuracy_score(y_test_cat, y_pred_cat)
cm = confusion_matrix(y_test_cat, y_pred_cat)

print("\n========== Classification ==========")

print("Accuracy:", round(accuracy, 4))

print("\nConfusion Matrix:")
print(cm)

print("\nClassification Report:")
print(classification_report(y_test_cat, y_pred_cat))

# -----------------------------
# 7. SAVE MODEL AND ENCODERS
# -----------------------------
os.makedirs(MODEL_DIR, exist_ok=True)

model_path = os.path.join(MODEL_DIR, "risk_model.pkl")
encoders_path = os.path.join(MODEL_DIR, "encoders.pkl")

with open(model_path, "wb") as f:
    pickle.dump(model, f)

with open(encoders_path, "wb") as f:
    pickle.dump(
        {
            "weather": le_weather,
            "road": le_road,
            "surface": le_surface
        },
        f
    )

print(f"\n✅ Model saved to: {model_path}")
print(f"✅ Encoders saved to: {encoders_path}")