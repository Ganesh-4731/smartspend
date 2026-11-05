import { asyncHandler } from '../utils/AppError.js';
import { resolveRange } from '../utils/dates.js';
import { buildInsights } from '../services/insights.js';

export const getInsights = asyncHandler(async (req, res) => {
  const { from, to } = resolveRange(req.valid.query);
  res.json({ success: true, data: await buildInsights(req.user, from, to) });
});
