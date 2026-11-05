import Budget from '../models/Budget.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { toMinor } from '../utils/money.js';
import { monthKey, todayUTC } from '../utils/dates.js';
import { budgetStatus } from '../services/budget.js';

const toDoc = (b) => ({
  overallLimitMinor: b.overallLimit == null ? null : toMinor(b.overallLimit),
  categoryLimits: b.categoryLimits.map((c) => ({ category: c.category, limitMinor: toMinor(c.limit) })),
});

export const list = asyncHandler(async (req, res) => {
  const items = await Budget.find({ user: req.user._id }).sort({ month: -1 }).limit(60);
  res.json({ success: true, data: items });
});

export const status = asyncHandler(async (req, res) => {
  const month = req.valid.query.month || monthKey(todayUTC());
  res.json({ success: true, data: await budgetStatus(req.user._id, month) });
});

export const create = asyncHandler(async (req, res) => {
  const b = req.valid.body;
  if (await Budget.exists({ user: req.user._id, month: b.month })) throw new AppError(409, `A budget for ${b.month} already exists. Edit it instead.`);
  const doc = await Budget.create({ user: req.user._id, month: b.month, ...toDoc(b) });
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const b = req.valid.body;
  const existing = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) throw new AppError(404, 'Budget not found');
  if (existing.month !== b.month) throw new AppError(400, 'A budget\'s month cannot be changed');
  existing.set(toDoc(b));
  await existing.save();
  res.json({ success: true, data: existing });
});

export const remove = asyncHandler(async (req, res) => {
  const doc = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!doc) throw new AppError(404, 'Budget not found');
  res.json({ success: true, data: { message: 'Budget deleted' } });
});
