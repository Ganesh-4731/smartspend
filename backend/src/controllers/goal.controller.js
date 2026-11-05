import SavingsGoal from '../models/SavingsGoal.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { toMinor, fromMinor, formatMoney } from '../utils/money.js';
import { parseDay, todayUTC } from '../utils/dates.js';

export const list = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: goals });
});

export const create = asyncHandler(async (req, res) => {
  const b = req.valid.body;
  const goal = await SavingsGoal.create({ user: req.user._id, title: b.title, description: b.description, targetMinor: toMinor(b.target), targetDate: parseDay(b.targetDate) });
  res.status(201).json({ success: true, data: goal });
});

export const update = asyncHandler(async (req, res) => {
  const b = req.valid.body;
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError(404, 'Goal not found');
  const targetMinor = toMinor(b.target);
  if (targetMinor < goal.savedMinor) throw new AppError(400, 'Target cannot be lower than the amount already saved', [{ field: 'target', message: `Already saved ${formatMoney(goal.savedMinor, req.user.preferences.currency)}` }]);
  goal.set({ title: b.title, description: b.description, targetMinor, targetDate: parseDay(b.targetDate) });
  await goal.save();
  res.json({ success: true, data: goal });
});

export const remove = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new AppError(404, 'Goal not found');
  res.json({ success: true, data: { message: 'Goal deleted' } });
});

// Atomic: the contribution is only applied if it does not push the saved total above the target.
export const contribute = asyncHandler(async (req, res) => {
  const { amount, date, note } = req.valid.body;
  const amountMinor = toMinor(amount);
  const when = date ? parseDay(date) : todayUTC();
  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, $expr: { $lte: [{ $add: ['$savedMinor', amountMinor] }, '$targetMinor'] } },
    { $inc: { savedMinor: amountMinor }, $push: { contributions: { amountMinor, date: when, note } } },
    { new: true, runValidators: true }
  );
  if (!goal) {
    const exists = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!exists) throw new AppError(404, 'Goal not found');
    const remaining = exists.targetMinor - exists.savedMinor;
    throw new AppError(400, remaining <= 0 ? 'This goal is already completed' : `Contribution exceeds the remaining amount (${fromMinor(remaining)})`,
      [{ field: 'amount', message: remaining <= 0 ? 'Goal already completed' : `Maximum allowed is ${fromMinor(remaining)}` }]);
  }
  res.status(201).json({ success: true, data: goal });
});

export const removeContribution = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  const c = goal?.contributions.id(req.params.contributionId);
  if (!goal || !c) throw new AppError(404, 'Contribution not found');
  const updated = await SavingsGoal.findOneAndUpdate(
    { _id: goal._id, user: req.user._id, 'contributions._id': c._id },
    { $inc: { savedMinor: -c.amountMinor }, $pull: { contributions: { _id: c._id } } },
    { new: true }
  );
  res.json({ success: true, data: updated });
});
