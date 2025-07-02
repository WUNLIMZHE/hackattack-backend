import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import { configDotenv } from "dotenv";


configDotenv(); // ✅ Load .env variables into process.env

const app = express();
const port = 3000;
const ML_API_URL = process.env.ML_API_URL;

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

import {
  SUPPORTED_SENSORS,
  locationMap,
  haversine,
  classifyAQI,
  validateSensor,
  generateTrendData,
  simulateSensorData,
  generateCompanySensorData,
  jsonToCSV
} from "./utils.js";

import {checkApiKey} from "./checkApiKey.js";

// Example sensor data
const sensorData = [/* same as before */];

app.post("/ping", (req, res) => {
  res.json({ message: "pong" });
});

//1. GET method
app.get("/random", (req, res) => {});

//2. GET method
app.get("/location/:id", (req, res) => {
  const id = parseInt(req.params.id);
  res.json();
});

app.post("/download-sensor-csv", (req, res) => {
  try {
    const result = generateCompanySensorData(req.body);
    const { filename, content } = jsonToCSV(result);

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "text/csv");
    res.send(content);
  } catch (err) {
    console.error("Error generating CSV:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// request body:
// {
//   "sensors": ["pm2.5", "pm10", "co2", "no2"],
//   "date": "2025-06-30",
//   "company": "hack-attack-2.0"
// }
// In actual implementation, we don't need sensors as request body since we can track the sensors via company 
app.post("/update-sensors-data", (req, res) => {
  const { sensors, date, company } = req.body;

  if (!Array.isArray(sensors) || !date || !company) {
    return res.status(400).json({
      error: "Missing or invalid body parameters: sensors (array), date, company."
    });
  }

  try {
    const result = generateCompanySensorData({ sensors, date, company });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//[29.8,59.1,5.2,17.9,18.9,9.2,1.72,6.3,319]
// POST a new EBM prediction
// Positive contribution → pushes prediction higher (e.g., worse air).
// Negative contribution → pulls prediction lower (e.g., better air).
app.post("/predict-air-monitoring", async (req, res) => {
  try {
    const inputData = req.body;

    if (!inputData.features || !Array.isArray(inputData.features)) {
      return res.status(400).json({ error: "'features' must be an array" });
    }

    const response = await axios.post(
      `${ML_API_URL}/predict-air-monitoring`,
      inputData
    );
    res.json({
      prediction: response.data.prediction,
      probabilities: response.data.probabilities,
      top_features: response.data.top_features,
    });
  } catch (error) {
    console.error(req.body.features);
    console.error("EBM API call failed:", error.message);
    if (error.response) {
      console.error("Response from EBM:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Failed to get prediction from EBM service" });
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

    const response = await axios.post(
      `${ML_API_URL}/predict-water-monitoring`,
      inputData
    );
    res.json({
      prediction: response.data.prediction,
      probabilities: response.data.probabilities,
    });
  } catch (error) {
    console.error(req.body.features);
    console.error("EBM API call failed:", error.message);
    if (error.response) {
      console.error("Response from EBM:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Failed to get prediction from EBM service" });
  }
});

// Cleaned up /realtime
app.get("/realtime", checkApiKey, (req, res) => {
  const { sensor, lat, long } = req.query;

  if (!sensor || !lat || !long) {
    return res.status(400).json({ error: "Missing required query parameters: sensor, lat, long." });
  }

  if (!validateSensor(sensor)) {
    return res.status(400).json({ error: "Invalid sensor type." });
  }

  let value;
  value = simulateSensorData(sensor);

  const unit = SUPPORTED_SENSORS[sensor];
  res.json({
    sensor,
    unit,
    value,
    timestamp: new Date().toISOString(),
    location: { lat: parseFloat(lat), long: parseFloat(long) },
    status: classifyAQI(sensor, value),
  });
});

// Cleaned up /filter
app.get("/filter", checkApiKey, (req, res) => {
  const { lat, long, radius } = req.query;
  if (!lat || !long || !radius) {
    return res.status(400).json({ error: "Missing required parameters: lat, long, radius." });
  }

  const centerLat = parseFloat(lat);
  const centerLong = parseFloat(long);
  const radiusKm = parseFloat(radius.replace("km", ""));

  const sensors = sensorData.filter((sensor) => {
    return haversine(centerLat, centerLong, sensor.lat, sensor.long) <= radiusKm;
  });

  res.json({ radius, center: { lat: centerLat, long: centerLong }, sensors });
});

// /trends
app.get("/trends", checkApiKey, (req, res) => {
  const { sensor, start, end, location } = req.query;

  if (!sensor || !start || !end || !location) {
    return res.status(400).json({ error: "Missing required query parameters." });
  }

  const unit = SUPPORTED_SENSORS[sensor];
  if (!unit) return res.status(400).json({ error: "Unsupported sensor type." });

  res.json({ sensor, unit, location, data: generateTrendData(start, end) });
});

// /alerts
app.get("/alerts", checkApiKey, async (req, res) => {
  const { sensor, threshold, location } = req.query;
  if (!sensor || !threshold || !location) {
    return res.status(400).json({ error: "Missing required query parameters." });
  }

  if (!validateSensor(sensor)) {
    return res.status(400).json({ error: "Unsupported sensor type." });
  }

  const numericThreshold = parseFloat(threshold);
  const region = locationMap[location.toLowerCase()];
  if (!region || isNaN(numericThreshold)) {
    return res.status(400).json({ error: "Invalid location or threshold." });
  }

  const allReadings = sensorData; // or await getSensorData(sensor);
  const exceedances = allReadings.filter((r) =>
    r.sensor === sensor &&
    r.value > numericThreshold &&
    r.lat >= region.boundingBox.latMin &&
    r.lat <= region.boundingBox.latMax &&
    r.long >= region.boundingBox.longMin &&
    r.long <= region.boundingBox.longMax
  );

  res.json({
    sensor,
    threshold: numericThreshold,
    exceedances: exceedances.map(({ value, timestamp, lat, long }) => ({
      value,
      timestamp,
      location: { lat, long },
    })),
  });
});

app.listen(port, () => {
  console.log(`Successfully started server on port ${port}.`);
});
