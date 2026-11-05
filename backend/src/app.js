import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  if (!env.RATE_LIMIT_DISABLED) {
    app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Please slow down.' } }));
  }
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
