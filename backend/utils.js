// utils.js
export const VALID_KEYS = ["1234-ABCD-5678", "ZXCV-9999-TEST"];

export const SUPPORTED_SENSORS = {
  pm10: "µg/m³",
  "pm2.5": "µg/m³",
  pm2_5: "µg/m³",
  co: "ppm",
  co2: "ppm",
  o3: "ppm",
  temperature: "°C",
  humidity: "%",
  no2: "ppb",
  so2: "ppb",
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

export const validateSensor = (sensor) => {
  return Object.keys(SUPPORTED_SENSORS).includes(sensor);
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

export const simulateSensorData = (sensor) => {
  let value;
  switch (sensor) {
    case "pm10":
    case "pm2.5":
      value = +(Math.random() * 150 + 10).toFixed(1);
      break;
    case "co":
      value = +(Math.random() * 9 + 0.5).toFixed(2);
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
