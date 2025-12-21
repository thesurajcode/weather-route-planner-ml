from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # Allows your Node.js backend to talk to this

# --- 1. ROBUST MODEL LOADING ---
print("⏳ Loading AI Models...")

# Get the absolute path to the 'ml' folder
# We assume this file is in ml/api/app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
ML_DIR = os.path.abspath(os.path.join(BASE_DIR, '..')) # Go up to 'ml'
MODELS_DIR = os.path.join(ML_DIR, 'models')

MODEL_PATH = os.path.join(MODELS_DIR, 'risk_model.pkl')
ENCODER_PATH = os.path.join(MODELS_DIR, 'encoders.pkl')

try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        encoders = pickle.load(f)
        # Extract individual encoders
        le_weather = encoders['weather']
        le_road = encoders['road']
        le_surface = encoders['surface']
        
    print("✅ Models & Encoders loaded successfully!")
except FileNotFoundError:
    print(f"❌ Error: Model files not found at {MODEL_PATH}")
    print("Did you run 'python train_model.py'?")
    model = None

@app.route('/', methods=['GET'])
def home():
    if model:
        return jsonify({"status": "ML API is Running", "brain_status": "Active"})
    else:
        return jsonify({"status": "Error", "message": "Models not loaded"}), 500

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model is not loaded"}), 500

    try:
        # 1. Get Data from Request
        data = request.get_json()
        
        # Inputs: Match exactly what 'generate_data.py' produced
        weather_input = data.get('weather', 'Clear')
        road_input = data.get('road_type', 'City')
        surface_input = data.get('surface', 'Dry') # New Feature!

        # 2. Helper: Safe Transform (Handle unknown values)
        def safe_transform(encoder, value):
            try:
                return encoder.transform([value])[0]
            except ValueError:
                # If "Snow" comes but we never trained on Snow, use the first known class
                return encoder.transform([encoder.classes_[0]])[0]

        # 3. Encode Inputs
        w_code = safe_transform(le_weather, weather_input)
        r_code = safe_transform(le_road, road_input)
        s_code = safe_transform(le_surface, surface_input)

        # 4. Create DataFrame (Must match training columns EXACTLY)
        features = pd.DataFrame([[w_code, r_code, s_code]], 
                                columns=['Weather_Code', 'Road_Code', 'Surface_Code'])

        # 5. Predict
        # The model returns a number between 1 and 10
        severity_score = model.predict(features)[0]

        # 6. Convert to Risk Percentage (0-100)
        risk_percentage = min(100, max(0, severity_score * 10))

        return jsonify({
            "risk_score": round(risk_percentage, 1),
            "severity_level": "High" if risk_percentage > 70 else "Medium" if risk_percentage > 40 else "Low",
            "inputs_received": {
                "weather": weather_input,
                "road": road_input,
                "surface": surface_input
            }
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on 5002 so it doesn't conflict with Node.js
    app.run(port=5002, debug=True)