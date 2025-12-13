from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # This allows your Node.js backend to talk to this Python server

# 1. Load the Model and Encoders
print("⏳ Loading AI Models...")
models_path = os.path.join(os.path.dirname(__file__), '..', 'models')

try:
    model = joblib.load(os.path.join(models_path, 'accident_risk_model.pkl'))
    le_weather = joblib.load(os.path.join(models_path, 'le_weather.pkl'))
    le_road = joblib.load(os.path.join(models_path, 'le_road.pkl'))
    le_time = joblib.load(os.path.join(models_path, 'le_time.pkl'))
    print("✅ Models loaded successfully!")
except FileNotFoundError:
    print("❌ Error: Model files not found. Did you run train_model.py?")
    exit()

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "ML API is Running", "model_accuracy": "84.8%"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Get data from the request
        data = request.get_json()
        
        # Expected format: {"weather": "Rain", "road_type": "Highway", "time_of_day": "Night"}
        weather_input = data.get('weather', 'Clear')
        road_input = data.get('road_type', 'City Street')
        time_input = data.get('time_of_day', 'Day')

        # 2. Convert text to numbers (using our loaded encoders)
        # We use a helper function to handle unknown categories safely
        def safe_transform(encoder, value):
            try:
                return encoder.transform([value])[0]
            except ValueError:
                return encoder.transform([encoder.classes_[0]])[0] # Default to first class if unknown

        w_encoded = safe_transform(le_weather, weather_input)
        r_encoded = safe_transform(le_road, road_input)
        t_encoded = safe_transform(le_time, time_input)

        # 3. Create a DataFrame for prediction
        features = pd.DataFrame([[w_encoded, r_encoded, t_encoded]], 
                              columns=['weather_encoded', 'road_encoded', 'time_encoded'])

        # 4. Make Prediction
        prediction = model.predict(features)[0]  # 0, 1, or 2
        
        # 5. Interpret Result
        severity_map = {0: "Low", 1: "Moderate", 2: "High"}
        risk_score_map = {0: 10, 1: 50, 2: 90} # Estimated score based on class

        result = {
            "prediction_class": int(prediction),
            "severity": severity_map[int(prediction)],
            "estimated_risk_score": risk_score_map[int(prediction)]
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5002 (since Node uses 5001)
    app.run(port=5002, debug=True)