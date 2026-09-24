import express from 'express';
import { config } from './utils/env.js';
import { logger } from './utils/logger.js';
import { createCorsMiddleware } from './middleware/corsMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Middlewares
app.use(createCorsMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in dev
if (!config.isProduction) {
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}

// Mount API routes
app.use('/api', apiRouter);

// Root health check fallback
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'MeetFlow AI Backend API is running.',
    docs: '/api/health'
  });
});

// Health check endpoint at root level for Render / monitoring
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MeetFlow AI Backend API',
    geminiConfigured: Boolean(config.geminiApiKey && config.geminiApiKey.length > 10),
    timestamp: new Date().toISOString()
  });
});

// Central error handler
app.use(errorHandler);

const PORT = config.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`MeetFlow AI backend server listening on http://${HOST}:${PORT}`);
  logger.info(`Allowed frontend origin: ${config.frontendUrl}`);
  logger.info(`Gemini API configured: ${Boolean(config.geminiApiKey && config.geminiApiKey.length > 10)}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

export default app;
