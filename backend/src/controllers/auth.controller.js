import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { issueToken, clearToken } from '../middleware/auth.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4); // equalises timing for unknown emails

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists');
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });
  const full = await User.findById(user._id).select('+tokenVersion');
  issueToken(res, full);
  res.status(201).json({ success: true, data: { user: user.toJSON() } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Invalid email or password');
  issueToken(res, user);
  res.json({ success: true, data: { user: user.toJSON() } });
});

export const logout = (_req, res) => {
  clearToken(res);
  res.json({ success: true, data: { message: 'Logged out' } });
};

export const me = (req, res) => res.json({ success: true, data: { user: req.user.toJSON() } });
