import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const COOKIE_NAME = 'smartspend_token';
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

export function cookieOptions() {
  return { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAMESITE, path: '/' };
}
export function issueToken(res, user) {
  const token = jwt.sign({ sub: user._id.toString(), tv: user.tokenVersion || 0 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
}
export function clearToken(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

// Authenticates the request and loads the user. Controllers always scope queries by req.user._id —
// a client-provided user id is never used for ownership.
export async function protect(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) throw new AppError(401, 'Authentication required');
    let payload;
    try { payload = jwt.verify(token, env.JWT_SECRET); } catch { throw new AppError(401, 'Session expired. Please log in again.'); }
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || (user.tokenVersion || 0) !== payload.tv) throw new AppError(401, 'Session expired. Please log in again.');
    req.user = user;
    next();
  } catch (e) { next(e); }
}
