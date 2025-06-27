// chatbot.js (ES Module version with Gemini API integration)
import express from 'express';

const router = express.Router();

// This array will act as our in-memory "database" for chat messages.
// In a real application, you would connect to a persistent database (e.g., MongoDB, PostgreSQL).
let chatHistory = [
  { id: 1, sender: 'bot', message: 'Hello! How can I help you today?' },
];
let nextMessageId = chatHistory.length > 0 ? Math.max(...chatHistory.map(todo => todo.id)) + 1 : 1;

// Removed: const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Removed: console.log("DEBUG: GEMINI_API_KEY loaded in chatbot.js:", GEMINI_API_KEY ? "Key Loaded (not empty)" : "Key is empty or not loaded");
// Removed: console.log("DEBUG: First 5 chars of GEMINI_API_KEY:", GEMINI_API_KEY.substring(0, 5));


/**
 * Function to interact with the Gemini API to generate a bot response.
 * Uses the gemini-2.0-flash model for text generation.
 * Accesses GEMINI_API_KEY from process.env directly when called.
 * @param {string} userMessage The user's input message.
 * @returns {Promise<string>} A promise that resolves to the bot's generated message.
 */
async function generateGeminiResponse(userMessage) {
  // IMPORTANT: Access GEMINI_API_KEY here, inside the function,
  // to ensure process.env has been populated by index.js's configDotenv().
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

  if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set in generateGeminiResponse.");
    return "I can't connect to my brain right now. Please ensure the API key is configured correctly.";
  }

  let modelChatHistory = [];
  modelChatHistory.push({ role: "user", parts: [{ text: userMessage }] });

  const payload = {
    contents: modelChatHistory,
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const text = result.candidates[0].content.parts[0].text;
      return text;
    } else {
      console.warn('Gemini API response structure unexpected or empty:', result);
      return "I'm having a little trouble understanding or generating a response. Could you rephrase that?";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error.message.includes("API key not valid") || error.message.includes("invalid api key")) {
      return "I can't connect to my brain right now. Please check the API key configuration in your .env file.";
    }
    return "I'm sorry, I encountered an internal error and cannot respond at the moment.";
  }
}

// Middleware specific to Chatbot routes (optional, for logging)
router.use((req, res, next) => {
  console.log(`[Chatbot Route] Time: ${new Date().toISOString()} - Request received: ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware or route handler
});

/**
 * @route GET /
 * @desc Get all chat history
 * @access Public
 */
router.get('/', (req, res) => {
  console.log('GET /api/chat - Returning all chat history.');
  res.json(chatHistory); // Send the current list of chat messages as JSON
});

/**
 * @route POST /
 * @desc Send a new message to the chatbot and get a response from Gemini
 * @access Public
 */
router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.log('POST /api/chat - Invalid request: Missing or empty message.');
    return res.status(400).json({ message: 'Message content is required.' });
  }

  const userMessage = {
    id: nextMessageId++,
    sender: 'user',
    message: message.trim(),
    timestamp: new Date().toISOString()
  };
  chatHistory.push(userMessage);
  console.log('User message added:', userMessage);

  let botResponseText;
  try {
    botResponseText = await generateGeminiResponse(userMessage.message);
  } catch (error) {
    console.error("Failed to get response from Gemini API:", error);
    botResponseText = "I apologize, but I'm currently unable to connect to my AI brain. Please try again later.";
  }

  const botMessage = {
    id: nextMessageId++,
    sender: 'bot',
    message: botResponseText,
    timestamp: new Date().toISOString()
  };
  chatHistory.push(botMessage);
  console.log('Bot response added:', botMessage);

  res.status(200).json({
    message: 'Message processed and response generated!',
    userMessage: userMessage,
    botMessage: botMessage,
    chatHistory: chatHistory
  });
});

export default router;
