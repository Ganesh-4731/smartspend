import dotenv from 'dotenv';
dotenv.config();

const bool = (v, d) => (v === undefined || v === '' ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));
const NODE_ENV = process.env.NODE_ENV || 'development';

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  COOKIE_SECURE: bool(process.env.COOKIE_SECURE, NODE_ENV === 'production'),
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || 'lax',
  TRUST_PROXY: Number(process.env.TRUST_PROXY) || 0,
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || (NODE_ENV === 'test' ? 4 : 12),
  RATE_LIMIT_DISABLED: bool(process.env.RATE_LIMIT_DISABLED, NODE_ENV === 'test'),
};

export function assertEnv() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env.`);
  if (env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long.');
  if (env.isProd && env.JWT_SECRET.startsWith('replace-with')) throw new Error('Set a real JWT_SECRET in production.');
}
