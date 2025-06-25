import express from "express";
import bodyParser from "body-parser";
import axios from "axios"
import { configDotenv } from "dotenv";

configDotenv(); // ✅ Load .env variables into process.env

const app = express();
const port = 3000;
const ML_API_URL = process.env.ML_API_URL;

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

//1. GET method
app.get("/random", (req, res) => {

});

//2. GET method
app.get("/location/:id", (req, res) =>{
  const id = parseInt(req.params.id);
  res.json();
});

//[29.8,59.1,5.2,17.9,18.9,9.2,1.72,6.3,319]
// POST a new EBM prediction
app.post("/predict", async (req, res) => {
  try {
    const inputData = req.body;

    if (!inputData.features || !Array.isArray(inputData.features)) {
      return res.status(400).json({ error: "'features' must be an array" });
    }

    const response = await axios.post(`${ML_API_URL}/predict`, inputData);
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


app.listen(port, () => {
  console.log(`Successfully started server on port ${port}.`);
});
