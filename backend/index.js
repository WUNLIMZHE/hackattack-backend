import express from "express";
import bodyParser from "body-parser";
import axios from "axios"
import { configDotenv } from "dotenv";
import cors from 'cors';

// Import the Firebase authentication middleware
import authMiddleware from './authMiddleware.js'; 

configDotenv(); // ✅ Load .env variables into process.env

const app = express();
const port = 3000;
const ML_API_URL = process.env.ML_API_URL;
console.log("📦 ML_API_URL is:", ML_API_URL);
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());


app.post("/ping", (req, res) => {
  res.json({ message: "pong" });
});


//1. GET method
app.get("/random", (req, res) => {
  // Your existing logic for /random
});

//2. GET method
app.get("/location/:id", (req, res) =>{
  const id = parseInt(req.params.id);
  // Your existing logic for /location/:id
});

//[29.8,59.1,5.2,17.9,18.9,9.2,1.72,6.3,319]
// POST a new EBM prediction
app.post("/predict-air-monitoring", async (req, res) => {
  try {
    const inputData = req.body;

    if (!inputData.features || !Array.isArray(inputData.features)) {
      return res.status(400).json({ error: "'features' must be an array" });
    }

    const response = await axios.post(`${ML_API_URL}/predict-air-monitoring`, inputData);
    res.json({
      prediction: response.data.prediction,
      probabilities: response.data.probabilities
    });
  } catch (error) {
    console.error(req.body.features);
    console.error("EBM API call failed:", error.message);
    if (error.response) {
      console.error("Response from EBM:", error.response.data);
    }
    res.status(500).json({ error: "Failed to get prediction from EBM service" });
  }
});

//[29.8,59.1,5.2,17.9,18.9,9.2,1.72,6.3,319]
// POST a new EBM prediction
app.post("/predict-water-monitoring", async (req, res) => {
  try {
    const inputData = req.body;

    if (!inputData.features || !Array.isArray(inputData.features)) {
      return res.status(400).json({ error: "'features' must be an array" });
    }

    const response = await axios.post(`${ML_API_URL}/predict-water-monitoring`, inputData);
    res.json({
      prediction: response.data.prediction,
      probabilities: response.data.probabilities
    });
  } catch (error) {
    console.error(req.body.features);
    console.error("EBM API call failed:", error.message);
    if (error.response) {
      console.error("Response from EBM:", error.response.data);
    }
    res.status(500).json({ error: "Failed to get prediction from EBM service" });
  }
});

import chatRoutes from './chatbot.js';
app.use('/api/chat', chatRoutes);

// This route will only be accessible if a valid Firebase ID token is provided
app.get('/protected-route', authMiddleware, (req, res) => {
  // If we reach here, the Firebase ID token was successfully verified by authMiddleware
  // req.user contains the decoded token with user information (e.g., uid, email)
  const userId = req.user.uid;
  const email = req.user.email;

  res.status(200).json({
    message: `Hello, authenticated user ${email}! Your UID is ${userId}. This is protected data from the backend.`,
    userData: req.user // You can send back relevant user data if needed
  });
});

app.listen(port, () => {
  console.log(`Successfully started server on port ${port}.`);
});
