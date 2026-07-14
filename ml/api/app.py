from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import os

app = Flask(__name__)
# ✅ Allow requests from any local port (Frontend 5173, Backend 5000)
CORS(app) 

print("⏳ Loading AI Models...")

# --- PATH CONFIGURATION ---
# Assuming structure: weather-route-planner-ml/api/app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, '../models'))

MODEL_PATH = os.path.join(MODELS_DIR, 'risk_model.pkl')
ENCODER_PATH = os.path.join(MODELS_DIR, 'encoders.pkl')

# --- MODEL LOADING ---
try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        encoders = pickle.load(f)
        le_weather = encoders['weather']
        le_road = encoders['road']
        le_surface = encoders['surface']
        
    print("✅ Models & Encoders loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print(f"Checking path: {MODEL_PATH}")
    model = None

@app.route('/', methods=['GET'])
def home():
    status = "Active" if model else "Inactive (Model Failed)"
    return jsonify({"status": "ML API Running", "brain": status})

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model is not loaded"}), 500

    try:
        data = request.get_json()
        
        # 1. Parse Inputs (with defaults)
        weather_input = data.get('weather', 'Clear')
        road_input = data.get('road_type', 'City')
        surface_input = data.get('surface', 'Dry') # This likely comes from backend logic

        # 2. Helper for Encoding
        def safe_transform(encoder, value):
            try:
                return encoder.transform([value])[0]
            except:
                return encoder.transform([encoder.classes_[0]])[0]

        # 3. Encode
        w_code = safe_transform(le_weather, weather_input)
        r_code = safe_transform(le_road, road_input)
        s_code = safe_transform(le_surface, surface_input)

        # 4. Predict Severity (1-10)
        features = pd.DataFrame([[w_code, r_code, s_code]], 
                                columns=['Weather_Code', 'Road_Code', 'Surface_Code'])
        
        severity_score = model.predict(features)[0]

        # 5. Format Response
        # The backend expects 'estimated_risk_score' (0-100)
        risk_score = min(100, max(0, severity_score * 10))
        
        response = {
            "estimated_risk_score": round(risk_score, 1), # Backend looks for this specific key
            "severity": "High" if risk_score > 70 else "Medium" if risk_score > 40 else "Low",
            "prediction_class": int(severity_score)
        }
        
        print(f"🔮 Prediction: {response}") # Log to terminal
        return jsonify(response)

    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # ✅ Run on Port 5001 to match your Backend .env
    print("🚀 ML Service starting on http://127.0.0.1:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)