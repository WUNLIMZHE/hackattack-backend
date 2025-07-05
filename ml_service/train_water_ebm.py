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
water_df = pd.read_csv("Water Quality Prediction.csv", header=None, na_values='?')

# Drop the first row which contains the column names (text)
water_df = water_df.drop(index=0).reset_index(drop=True)

# Rename columns manually
water_df.columns = [
    "Index", "pH", "Iron", "Nitrate", "Chloride", "Lead", "Zinc",
    "Color", "Turbidity", "Fluoride", "Copper", "Odor", "Sulfate", "Conductivity", "Chlorine", "Manganese", "Total Dissolved Solids", "Source", "Water Temperature", "Air Temperature", "Month", "Day", "Time of Day", "Target"
]

# print(water_df.columns)

# Drop rows with missing values for training sets
water_df = water_df.dropna()

from sklearn.preprocessing import OneHotEncoder
# Select the categorical columns to encode
# "Color", "Source", "Month" all three are categorical features, but then we only use color as input training feature, so we only encode the feature "Color"
categorical_cols = ["Color"]
categorical_data = water_df[categorical_cols]

# Initialize the OneHotEncoder
encoder = OneHotEncoder(sparse_output=False)

# Fit and transform the selected categorical columns
one_hot_encoded = encoder.fit_transform(categorical_data)

# Get the new column names
encoded_col_names = encoder.get_feature_names_out(categorical_cols)

# Convert to DataFrame
one_hot_df = pd.DataFrame(one_hot_encoded, columns=encoded_col_names, index=water_df.index)

# Drop original categorical columns and join the one-hot encoded columns
water_df = water_df.drop(columns=categorical_cols).join(one_hot_df)

# Get all columns that start with 'Color_'
color_columns = [col for col in water_df.columns if col.startswith("Color_")]

# Define other selected columns (before and after 'Color_')
before_color = ['Total Dissolved Solids', 'Odor', 'Turbidity', 'Chloride', 'Time of Day']

# Combine them in the desired order
selected_columns = before_color + color_columns + ['Target']

# Reorder the DataFrame
water_df = water_df[selected_columns]

# Convert with Auto-Infer and Handle Errors
# Keep a copy of 'Target' column
target_col = water_df["Target"]

# Convert all other columns to float
features_only = water_df.drop(columns=["Target"]).apply(pd.to_numeric, errors='coerce').fillna(0).astype(float)

# Re-attach 'Target' column as int
features_only["Target"] = target_col.astype(int)

# Replace original DataFrame
water_df = features_only

# View first 5 rows
# print(water_df.head())
# print(water_df.info())

# !pip install imbalanced-learn
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from collections import Counter
import pandas as pd
import numpy as np

# Stratified sampling to get 6000 rows in total
# This line is crucial for selecting your subset
water_df_sample, _ = train_test_split(
    water_df,
    train_size=6000,
    stratify=water_df['Target'],
    random_state=42
)

# print(f"\nSampled 6000 rows shape: {water_df_sample.shape}")
# print(f"Sampled 6000 rows class distribution: {Counter(water_df_sample['Target'])}")


# Separate features and target from the SAMPLED 6000 rows
X_water = water_df_sample.drop('Target', axis=1)
y_water = water_df_sample['Target']

# Now your existing code continues as before, operating on X_water and y_water (the 6000 rows)

# 1. Split into training and testing sets FIRST (from the 6000 sampled rows)
X_water_train, X_water_test, y_water_train, y_water_test = train_test_split(
    X_water, y_water, test_size=0.2, stratify=y_water, random_state=42
)

# print(f"\nOriginal training set shape (from 6000 rows): {X_water_train.shape}, Class distribution: {Counter(y_water_train)}")

# 2. Apply SMOTE only on the TRAINING data
smote = SMOTE(random_state=42)
X_water_train_resampled, y_water_train_resampled = smote.fit_resample(X_water_train, y_water_train)

# print(f"Resampled training set shape: {X_water_train_resampled.shape}, Class distribution: {Counter(y_water_train_resampled)}")

params = {'interactions': 10, 'learning_rate': 0.05, 'max_bins': 256, 'max_interaction_bins': 16, 'min_samples_leaf': 2}

# Define the EBM model with the custom hyperparameters
ebm = ExplainableBoostingClassifier(
    **params,
    random_state=42,
)

# Train the EBM model using specified features and the target variable from the training set
ebm.fit(X_water_train, y_water_train)

from sklearn.metrics import accuracy_score, recall_score, precision_score, f1_score, confusion_matrix
# Make predictions using the trained model on the test set with the same features
predictions = ebm.predict(X_water_test)

# print("\n===== Testing Accuracy =====")

# # Print the accuracy of the model on the test set
# accuracy = accuracy_score(y_water_test, predictions)
# print('Accuracy:', accuracy)

# # Print the recall of the model on the test set
# recall = recall_score(y_water_test, predictions, average="weighted", zero_division=0)
# print('Recall:', recall)

# # Print the precision of the model on the test set
# precision = precision_score(y_water_test, predictions, average="weighted", zero_division=0)
# print('Precision:', precision)

# # Calculate and print the F1 score of the model on the test set
# f1 = 2 * recall * precision / (precision + recall)
# print('F1 score:', f1)

# # Calculate and print the confusion matrix of the model on the test set
# confusion = confusion_matrix(y_water_test, predictions)
# print('Confusion matrix:')
# print(confusion)
# print()

# Save model to disk
joblib.dump(ebm, "water_ebm_model.pkl")

print("EBM model trained and saved as water_ebm_model.pkl")