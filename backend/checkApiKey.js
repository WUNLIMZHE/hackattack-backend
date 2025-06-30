// checkApiKey.js
import { VALID_KEYS } from "./utils.js";

export const checkApiKey = (req, res, next) => {
  const apiKey = req.header("x-api-key");
  if (!VALID_KEYS.includes(apiKey)) {
    return res.status(401).json({ error: "Unauthorized. Invalid API key." });
  }
  next();
};

