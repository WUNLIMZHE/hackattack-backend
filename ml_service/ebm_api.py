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

    # Return prediction and probabilities
    return {"prediction": prediction, "probabilities": probabilities}

@app.post("/predict-water-monitoring")
def predict(data: InputData):
    
    # Return prediction and probabilities
    return {"Water monitoring prediction successfully connected. WIP..."}
