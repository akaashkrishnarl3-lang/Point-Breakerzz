import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '10000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  firebaseProjectId: (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  jwtSecret: process.env.JWT_SECRET || 'meetflow-jwt-super-secret-key-2026',
  geminiApiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '',
  isProduction: process.env.NODE_ENV === 'production'
};
