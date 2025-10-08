from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from pathlib import Path

app = Flask(__name__)
CORS(app)


BASE_DIR = Path(__file__).resolve().parent
model = joblib.load("gb_model.pkl")

@app.route("/")
def home():
    return jsonify({"status": "ok"})

@app.route('/predict',methods = ['POST'])
def predict():
    data = request.json
    sentence = data.get("sentence","")
    if not sentence:
        return jsonify({"error": "No sentence provided"}), 400
    
    prediction = model.predict([sentence])[0]
    return jsonify({"prediction": prediction})

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000, debug=True)