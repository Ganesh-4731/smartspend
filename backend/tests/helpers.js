import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';

let mem;
// Uses an in-memory MongoDB by default (binary is downloaded on first run).
// Set TEST_MONGODB_URI to a DEDICATED database whose name contains "test" to use a real server instead.
export async function startDb() {
  const uri = process.env.TEST_MONGODB_URI;
  if (uri) {
    if (!/test/i.test(new URL(uri).pathname)) throw new Error('TEST_MONGODB_URI database name must contain "test"');
    await mongoose.connect(uri);
  } else {
    mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
  }
}
export async function stopDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mem) await mem.stop();
}
export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}
export const app = createApp();
export const newAgent = () => request.agent(app);
export async function registerAgent(email = 'a@example.com', name = 'Alice Test') {
  const agent = newAgent();
  const res = await agent.post('/api/auth/register').send({ name, email, password: 'Passw0rd123' });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}
export const tx = (o = {}) => ({ title: 'Lunch', amount: 250.5, type: 'expense', category: 'Food', date: '2026-10-05', ...o });
export { request };
