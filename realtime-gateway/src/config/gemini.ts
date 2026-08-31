import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './env';

let genAI: GoogleGenerativeAI | null = null;

if (config.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    console.log('✅ Google Gemini AI SDK initialized successfully.');
  } catch (err: any) {
    console.warn(`⚠️ Gemini init error: ${err.message}`);
  }
} else {
  console.log('ℹ️ GEMINI_API_KEY not found in environment. Using smart local AI engine with dynamic root-cause synthesis.');
}

export function getGeminiModel() {
  if (genAI && config.geminiApiKey) {
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return null;
}
