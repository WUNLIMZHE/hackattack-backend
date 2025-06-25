# Core libraries
import pandas as pd
import numpy as np

# For splitting and evaluating data
from sklearn.model_selection import train_test_split

# Explainable Boosting Machine (EBM)
from interpret.glassbox import ExplainableBoostingClassifier
from interpret import show

import joblib

# Load the dataset from a CSV file
# - 'header=None' tells pandas that the file has no header row; all rows will be treated as data
# - 'na_values="?"' replaces any "?" in the file with NaN (missing value), useful for data cleaning
# Load CSV with header=None
df = pd.read_csv("air_quality_data.csv", header=None, na_values='?')

# Drop the first row which contains the column names (text)
df = df.drop(index=0).reset_index(drop=True)

# Rename columns manually
df.columns = [
    "Temperature", "Humidity", "PM2.5", "PM10", "NO2", "SO2", "CO",
    "Proximity_to_Industry", "Population_Density", "Air_Quality"
]

from sklearn.preprocessing import LabelEncoder

# Extract target column
y = df["Air_Quality"]

# Initialize and fit encoder
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# Replace original target column with encoded version (optional)
df["Air_Quality"] = y_encoded

# See the class-to-number mapping
print("Class mapping:", dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_))))

# Separate features and target
X = df.drop('Air_Quality', axis=1)
y = df['Air_Quality']

# Split data into train and test sets (80/20 split)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

params = {'learning_rate': 0.05, 'max_bins': 256}

# Define the EBM model with the custom hyperparameters
ebm = ExplainableBoostingClassifier(
    **params,
    random_state=42,
    interactions=0
)

# Train the EBM model using specified features and the target variable from the training set
ebm.fit(X_train, y_train)

# Save model to disk
joblib.dump(ebm, "ebm_model.pkl")

print("EBM model trained and saved as ebm_model.pkl")