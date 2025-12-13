import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("🚀 Starting Model Training...")

# 1. Load Data
data_path = os.path.join('data', 'processed', 'accidents_delhi.csv')
if not os.path.exists(data_path):
    print(f"❌ Error: Data file not found at {data_path}. Run generate_data.py first.")
    exit()

df = pd.read_csv(data_path)

# 2. Preprocessing: Convert Words to Numbers (Label Encoding)
# We need to save these encoders so our App can understand words like "Rain" later!
le_weather = LabelEncoder()
le_road = LabelEncoder()
le_time = LabelEncoder()

df['weather_encoded'] = le_weather.fit_transform(df['weather'])
df['road_encoded'] = le_road.fit_transform(df['road_type'])
df['time_encoded'] = le_time.fit_transform(df['time_of_day'])

# 3. Define Features (Inputs) and Target (Output)
# We don't use latitude/longitude for training strictly to avoid overfitting to specific points,
# but for a simple risk model, environment factors are key.
X = df[['weather_encoded', 'road_encoded', 'time_encoded']]
y = df['severity'] # predicting 0 (Low), 1 (Moderate), 2 (High)

# 4. Split Data (80% for training, 20% for testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Train XGBoost Model
print("🧠 Training XGBoost Model...")
model = xgb.XGBClassifier(
    objective='multi:softmax', 
    num_class=3, 
    n_estimators=100, 
    learning_rate=0.1,
    max_depth=5
)
model.fit(X_train, y_train)

# 6. Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model Trained! Accuracy: {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 7. Save the Model and Encoders
# We need all 4 files to run the API
models_dir = 'models'
os.makedirs(models_dir, exist_ok=True)

joblib.dump(model, os.path.join(models_dir, 'accident_risk_model.pkl'))
joblib.dump(le_weather, os.path.join(models_dir, 'le_weather.pkl'))
joblib.dump(le_road, os.path.join(models_dir, 'le_road.pkl'))
joblib.dump(le_time, os.path.join(models_dir, 'le_time.pkl'))

print(f"💾 Model and Encoders saved to '{models_dir}/' folder.")