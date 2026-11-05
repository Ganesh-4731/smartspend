import mongoose from 'mongoose';
import { env, assertEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  assertEnv();
  await connectDB(env.MONGODB_URI);
  console.log('MongoDB connected');
  const server = createApp().listen(env.PORT, () => console.log(`SmartSpend API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`));
  const shutdown = async () => { server.close(); await mongoose.disconnect(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
main().catch((e) => { console.error('Failed to start server:', e.message); process.exit(1); });
