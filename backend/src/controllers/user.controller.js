import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { issueToken, clearToken } from '../middleware/auth.js';
import { toMinor } from '../utils/money.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, openingBalance, preferences } = req.valid.body;
  const $set = {};
  if (name !== undefined) $set.name = name;
  if (openingBalance !== undefined) $set.openingBalanceMinor = toMinor(openingBalance);
  for (const [k, v] of Object.entries(preferences || {})) $set[`preferences.${k}`] = v; // currency is a display preference only: no conversion
  const user = await User.findByIdAndUpdate(req.user._id, { $set }, { new: true, runValidators: true });
  res.json({ success: true, data: { user: user.toJSON() } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.valid.body;
  const user = await User.findById(req.user._id).select('+passwordHash +tokenVersion');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new AppError(400, 'Current password is incorrect', [{ field: 'currentPassword', message: 'Current password is incorrect' }]);
  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion || 0) + 1; // invalidates every previously issued token
  await user.save();
  issueToken(res, user);
  res.json({ success: true, data: { message: 'Password updated' } });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.valid.body.password, user.passwordHash))) throw new AppError(400, 'Password is incorrect', [{ field: 'password', message: 'Password is incorrect' }]);
  await Promise.all([
    Transaction.deleteMany({ user: user._id }),
    Budget.deleteMany({ user: user._id }),
    SavingsGoal.deleteMany({ user: user._id }),
  ]);
  await User.deleteOne({ _id: user._id });
  clearToken(res);
  res.json({ success: true, data: { message: 'Account deleted' } });
});
