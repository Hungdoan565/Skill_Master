import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

let groqClient = null;
let warningLogged = false;

/**
 * Get Groq SDK client instance (lazy singleton)
 * Returns null if API key is not configured
 */
export function getGroqClient() {
  if (!GROQ_API_KEY) {
    if (!warningLogged) {
      console.warn('⚠️ GROQ_API_KEY chưa cấu hình. Chatbot Molly chuyển sang offline mode.');
      warningLogged = true;
    }
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
    console.log('✅ Groq client initialized successfully');
  }

  return groqClient;
}

/**
 * Check if Groq is available
 */
export function isGroqAvailable() {
  return !!GROQ_API_KEY;
}
