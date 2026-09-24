import cors from 'cors';
import { config } from '../utils/env.js';

export function createCorsMiddleware() {
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list or regex (e.g. Vercel deployment preview URLs)
      const isAllowed = allowedOrigins.some(allowed => {
        if (!allowed) return false;
        return origin === allowed || origin.startsWith(allowed);
      }) || (config.isProduction ? false : origin.includes('localhost'));

      if (isAllowed) {
        callback(null, true);
      } else {
        // In development, be forgiving; in production, enforce origin
        if (!config.isProduction) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin not allowed: ${origin}`));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });
}
