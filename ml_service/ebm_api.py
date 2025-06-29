# ebm_api.py
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import joblib

# Load the saved EBM model
model = joblib.load("ebm_model.pkl")

# Set up FastAPI
app = FastAPI()

# Define expected request format
class InputData(BaseModel):
    features: list[float]

@app.post("/predict-air-monitoring")
def predict(data: InputData):
    # Convert input to NumPy array
    input_array = np.array([data.features])

    # Make prediction
    prediction = int(model.predict(input_array)[0])
    probabilities = model.predict_proba(input_array)[0].tolist()

    # Get local explanation
    explanation = model.explain_local(input_array, [0])
    raw_scores = explanation.data(0)['scores']
    feature_names = explanation.data(0)['names']

    # Ensure scores are a flat list of numbers.
    # This handles cases where explanation.data(0)['scores'] might return
    # a list of single-element arrays or a 2D array.
    scores = []
    for s in raw_scores:
        if isinstance(s, (list, np.ndarray)):
            scores.append(s[0] if len(s) > 0 else 0.0) # Take the first element if it's an array/list
        else:
            scores.append(s) # Otherwise, append as is (it's already a number)

    # Normalize to percentage
    total = sum(abs(s) for s in scores)
    top_features = sorted(
        zip(feature_names, scores),
        key=lambda x: abs(x[1]),
        reverse=True
    )

    # Return top 5 features (or any number you prefer)
    top_features_with_percentage = [
        {
            "feature": f,
            "contribution": s,
            "percent": round(abs(s) / total * 100, 2) if total != 0 else 0.0
        }
        for f, s in top_features
    ]
    
    return {
        "prediction": prediction,
        "probabilities": probabilities,
        "top_features": top_features_with_percentage
    }

@app.post("/predict-water-monitoring")
def predict(data: InputData):
    
    # Return prediction and probabilities
    return {"prediction": 1, "probabilities": 100}
