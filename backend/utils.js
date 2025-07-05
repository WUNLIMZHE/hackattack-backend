// utils.js
export const VALID_KEYS = ["1234-ABCD-5678", "ZXCV-9999-TEST"];

export const SUPPORTED_AIR_SENSORS = {
  pm10: "µg/m³",
  "pm2.5": "µg/m³",
  co: "ppm",
  co2: "ppm",
  // o3: "ppm",
  temperature: "°C",
  humidity: "%",
  no2: "ppb",
  so2: "ppb",
};

export const SUPPORTED_WATER_SENSORS = {
  total_dissolved_solids: "mg/L",  // or ppm (1 mg/L ≈ 1 ppm for water)
  odor: "",                        // typically unitless or qualitative (e.g., "threshold odor number")
  turbidity: "NTU",               // Nephelometric Turbidity Units
  chloride: "mg/L",               // or ppm
  time_of_day: "",                // this is a categorical/time feature, no unit
  color: ""                       // qualitative or categorical (e.g., "Yellow"), so no unit
};

export const locationMap = {
  penang: {
    boundingBox: {
      latMin: 5.2,
      latMax: 5.5,
      longMin: 100.2,
      longMax: 100.4,
    },
  },
};

export function jsonToCSV(json) {
  const { company, date, sensors } = json;
  const rows = [["time", "sensor", "value"]];

  for (const sensorObj of sensors) {
    const { sensor, data } = sensorObj;

    for (const { time, value } of data) {
      rows.push([time, sensor, value ?? ""]);
    }
  }

  return {
    filename: `${company},${date}.csv`,
    content: rows.map((r) => r.join(",")).join("\n")
  };
}

export const haversine = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const classifyAQI = (sensor, value) => {
  if (value < 50) return "good";
  if (value < 100) return "moderate";
  if (value < 150) return "unhealthy";
  return "hazardous";
};

export const validateSensor = (sensor, monitoring_type) => {
  return monitoring_type === "air" ? Object.keys(SUPPORTED_AIR_SENSORS).includes(sensor) : Object.keys(SUPPORTED_WATER_SENSORS).includes(sensor) ;
};

export const generateTrendData = (start, end) => {
  const data = [];
  const currentDate = new Date(start);
  const endDate = new Date(end);
  while (currentDate <= endDate) {
    data.push({
      date: currentDate.toISOString().split("T")[0],
      value: Math.floor(Math.random() * 100) + 50,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

export const simulateSensorAirData = (sensor) => {
  let value;
  switch (sensor) {
    case "pm10":
    case "pm2.5":
      value = +(Math.random() * 150 + 10).toFixed(1);
      break;
    case "co":
      value = +(Math.random() * 9 + 0.5).toFixed(2);
      break;
    case "co2":
      value = +(Math.random() * 1600 + 400).toFixed(0);  // Range: 400–2000 ppm
      break;
    case "temperature":
      value = +(Math.random() * 10 + 25).toFixed(1);
      break;
    case "humidity":
      value = +(Math.random() * 60 + 30).toFixed(0);
      break;
    case "no2":
    case "so2":
      value = +(Math.random() * 100 + 5).toFixed(1);
      break;
    default:
      value = null;
  }
  return value;
}

export const simulateSensorWaterData = (sensor) => {
  let value;
  switch (sensor) {
    case "total_dissolved_solids":
      value = +(Math.random() * 150 + 10).toFixed(1);
      break;
    case "odor":
      value = +(Math.random() * 9 + 0.5).toFixed(2);
      break;
    case "turbidity":
      value = +(Math.random() * 1600 + 400).toFixed(0);  // Range: 400–2000 ppm
      break;
    case "chloride":
      value = +(Math.random() * 10 + 25).toFixed(1);
      break;
    case "time_of_day":
      value = +(Math.random() * 60 + 30).toFixed(0);
      break;
    case "color":
      value = Math.floor(Math.random() * 5);
      break;
    default:
      value = null;
  }
  return value;
}

export const generateCompanySensorAirData = ({ sensors, date, company }) => {
  const now = new Date();
  const currentHour = (now.getUTCHours() + 8) % 24; // for UTC+8
  const responseData = [];

  for (const sensor of sensors) {
    if (!validateSensor(sensor, "air")) {
      throw new Error(`Invalid sensor type: ${sensor}`);
    }

    const data = [];
    for (let hour = 0; hour < Math.min(currentHour, 19); hour++) {
      const value = simulateSensorAirData(sensor);
      const timeLabel = `${hour.toString().padStart(2, "0")}:00`;
      data.push({ time: timeLabel, value });
    }

    responseData.push({ sensor, data });
  }

  return {
    company,
    date,
    now,
    currentHour,
    sensors: responseData,
  };
}

export const generateCompanySensorWaterData = ({ sensors, date, company }) => {
  const now = new Date();
  const currentHour = (now.getUTCHours() + 8) % 24; // for UTC+8
  const responseData = [];

  for (const sensor of sensors) {
    if (!validateSensor(sensor, "water")) {
      throw new Error(`Invalid sensor type: ${sensor}`);
    }

    const data = [];
    for (let hour = 0; hour < Math.min(currentHour, 19); hour++) {
      const value = simulateSensorWaterData(sensor);
      const timeLabel = `${hour.toString().padStart(2, "0")}:00`;
      data.push({ time: timeLabel, value });
    }

    responseData.push({ sensor, data });
  }

  return {
    company,
    date,
    now,
    currentHour,
    sensors: responseData,
  };
}

// Simplify top_features before sending the response
export const simplifyTopFeatures = (topFeatures) => {
  const simplified = {};

  topFeatures.forEach(({ feature, contribution, percent }) => {
    // Skip interaction features
    if (feature.includes("&")) return;

    // Group all Color_* features as 'color'
    const key = feature.startsWith("Color_") ? "color" : feature;

    if (!simplified[key]) {
      simplified[key] = { contribution: 0, percent: 0 };
    }

    simplified[key].contribution += contribution;
    simplified[key].percent += percent;
  });

  // Convert to array and sort by percent descending
  return Object.entries(simplified)
    .map(([feature, values]) => ({
      feature,
      contribution: values.contribution,
      percent: parseFloat(values.percent.toFixed(2)),
    }))
    .sort((a, b) => b.percent - a.percent);
};