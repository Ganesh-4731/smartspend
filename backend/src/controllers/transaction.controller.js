import Transaction from '../models/Transaction.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { parseDay, fmtDay } from '../utils/dates.js';
import { toMinor, fromMinor } from '../utils/money.js';
import { toCsv } from '../utils/csv.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildFilter(userId, q) {
  const f = { user: userId }; // ownership is always part of the query
  if (q.type) f.type = q.type;
  if (q.category) f.category = String(q.category);
  if (q.from || q.to) {
    f.date = {};
    if (q.from) f.date.$gte = parseDay(q.from);
    if (q.to) f.date.$lte = parseDay(q.to);
  }
  if (q.minAmount != null || q.maxAmount != null) {
    f.amountMinor = {};
    if (q.minAmount != null) f.amountMinor.$gte = toMinor(q.minAmount);
    if (q.maxAmount != null) f.amountMinor.$lte = toMinor(q.maxAmount);
  }
  if (q.search) {
    const re = new RegExp(escapeRegex(q.search), 'i');
    f.$or = [{ title: re }, { notes: re }];
  }
  return f;
}
const sortOf = (q) => {
  const dir = q.order === 'asc' ? 1 : -1;
  return q.sort === 'amount' ? { amountMinor: dir, _id: dir } : { date: dir, _id: dir };
};
const toDoc = (b) => ({ title: b.title, amountMinor: toMinor(b.amount), type: b.type, category: b.category, date: parseDay(b.date),
  paymentMethod: b.paymentMethod, notes: b.notes, tags: b.tags });

export const list = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = buildFilter(req.user._id, q);
  const [items, total, sums] = await Promise.all([
    Transaction.find(filter).sort(sortOf(q)).skip((q.page - 1) * q.limit).limit(q.limit),
    Transaction.countDocuments(filter),
    Transaction.aggregate([{ $match: filter }, { $group: { _id: '$type', total: { $sum: '$amountMinor' } } }]),
  ]);
  const s = (t) => fromMinor(sums.find((r) => r._id === t)?.total || 0);
  res.json({ success: true, data: items, meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(Math.ceil(total / q.limit), 1),
    totals: { income: s('income'), expense: s('expense') } } });
});

export const getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) throw new AppError(404, 'Transaction not found');
  res.json({ success: true, data: tx });
});

export const create = asyncHandler(async (req, res) => {
  const tx = await Transaction.create({ ...toDoc(req.valid.body), user: req.user._id });
  res.status(201).json({ success: true, data: tx });
});

export const update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: toDoc(req.valid.body) }, { new: true, runValidators: true });
  if (!tx) throw new AppError(404, 'Transaction not found');
  res.json({ success: true, data: tx });
});

export const remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) throw new AppError(404, 'Transaction not found');
  res.json({ success: true, data: { message: 'Transaction deleted' } });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const rows = await Transaction.find(buildFilter(req.user._id, q)).sort(sortOf(q)).limit(50000).lean();
  const csv = toCsv([
    { header: 'Date', value: (r) => fmtDay(r.date) },
    { header: 'Title', value: 'title' },
    { header: 'Type', value: 'type' },
    { header: 'Category', value: 'category' },
    { header: 'Amount', value: (r) => fromMinor(r.amountMinor).toFixed(2) },
    { header: 'Payment Method', value: 'paymentMethod' },
    { header: 'Notes', value: 'notes' },
    { header: 'Tags', value: 'tags' },
  ], rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.send(csv);
});
