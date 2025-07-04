import express from 'express';

const router = express.Router();

let chatHistory = [{ id: 1, sender: 'bot', message: 'Hello! How can I help you today?' }];
let nextMessageId = chatHistory.length > 0 ? Math.max(...chatHistory.map(t => t.id)) + 1 : 1;

const MAX_HISTORY_MESSAGES = 10; 
// We'll instruct Gemini to limit its response, so no hard truncation here.
// const MAX_RESPONSE_LENGTH = 500; // This constant is now primarily for prompt instruction

async function generateGeminiResponse(userMessage, currentChatHistory) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
  if (!GEMINI_API_KEY) return "Error: API key not set.";

  const relevantHistory = currentChatHistory.slice(-MAX_HISTORY_MESSAGES); 
  
  // Prepare chat history for Gemini, adding a system instruction at the beginning
  let modelChatHistory = [
    { role: "user", parts: [{ text: "Your response should be concise, ideally under 5000 characters, and grammatically complete. Do not truncate mid-sentence. Focus on answering the user's question directly." }] },
    { role: "model", parts: [{ text: "Understood. I will provide concise and complete answers." }]} // Acknowledgment from "model"
  ];

  // Add the relevant chat history, mapping sender roles
  relevantHistory.forEach(msg => {
    modelChatHistory.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    });
  });

  const payload = { contents: modelChatHistory }; // Send the full modified history with instruction
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) { const err = await response.json(); throw new Error(`Gemini API failed: ${JSON.stringify(err)}`); }
    const result = await response.json();
    
    // We trust Gemini to adhere to the prompt; no hard truncation here.
    let generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    
    return generatedText;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "I'm sorry, I'm having trouble connecting or generating a complete response at the moment.";
  }
}

router.use((req, res, next) => { console.log(`[Chatbot] ${req.method} ${req.originalUrl}`); next(); });
router.get('/', (req, res) => res.json(chatHistory));

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Message required.' });

  const userMessage = { id: nextMessageId++, sender: 'user', message: message.trim(), timestamp: new Date().toISOString() };
  chatHistory.push(userMessage);

  const botResponseText = await generateGeminiResponse(userMessage.message, chatHistory);

  const botMessage = { id: nextMessageId++, sender: 'bot', message: botResponseText, timestamp: new Date().toISOString() };
  chatHistory.push(botMessage);

  res.status(200).json({ message: 'Response generated!', userMessage, botMessage });
});

export default router;