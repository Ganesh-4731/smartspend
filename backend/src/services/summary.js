import Transaction from '../models/Transaction.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { fromMinor, pct } from '../utils/money.js';
import { daysBetween, daysList, monthsBetween, todayUTC } from '../utils/dates.js';

export async function totals(userId, from, to) {
  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: from, $lte: to } } },
    { $group: { _id: '$type', total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
  ]);
  const g = (t) => rows.find((r) => r._id === t) || { total: 0, count: 0 };
  return {
    incomeMinor: g('income').total,
    expenseMinor: g('expense').total,
    incomeCount: g('income').count,
    expenseCount: g('expense').count,
    count: g('income').count + g('expense').count,
  };
}

// Total balance = opening balance + all income - all expenses dated up to today.
// Savings-goal contributions are earmarked inside this balance and are NOT subtracted (no double counting).
export async function balanceMinor(user) {
  const rows = await Transaction.aggregate([
    { $match: { user: user._id, date: { $lte: todayUTC() } } },
    { $group: { _id: '$type', total: { $sum: '$amountMinor' } } },
  ]);
  const inc = rows.find((r) => r._id === 'income')?.total || 0;
  const exp = rows.find((r) => r._id === 'expense')?.total || 0;
  return (user.openingBalanceMinor || 0) + inc - exp;
}

export function granularityFor(from, to) {
  return daysBetween(from, to) <= 62 ? 'day' : 'month';
}

export async function series(userId, from, to, granularity = granularityFor(from, to)) {
  const format = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';
  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: from, $lte: to } } },
    { $group: { _id: { k: { $dateToString: { format, date: '$date' } }, t: '$type' }, total: { $sum: '$amountMinor' } } },
  ]);
  const keys = granularity === 'day' ? daysList(from, to) : monthsBetween(from, to);
  const map = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]));
  for (const r of rows) if (map.has(r._id.k)) map.get(r._id.k)[r._id.t] = r.total;
  return keys.map((k) => {
    const v = map.get(k);
    return { period: k, income: fromMinor(v.income), expense: fromMinor(v.expense), savings: fromMinor(v.income - v.expense) };
  });
}

export async function categoryBreakdown(userId, from, to, type = 'expense') {
  const rows = await Transaction.aggregate([
    { $match: { user: userId, type, date: { $gte: from, $lte: to } } },
    { $group: { _id: '$category', total: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
    { $sort: { total: -1, _id: 1 } },
  ]);
  const sum = rows.reduce((a, r) => a + r.total, 0);
  return rows.map((r) => ({ category: r._id, totalMinor: r.total, total: fromMinor(r.total), count: r.count, percent: pct(r.total, sum) }));
}

export async function goalsSummary(userId) {
  const goals = await SavingsGoal.find({ user: userId }).select('targetMinor savedMinor');
  const saved = goals.reduce((a, g) => a + g.savedMinor, 0);
  const target = goals.reduce((a, g) => a + g.targetMinor, 0);
  return {
    count: goals.length,
    completed: goals.filter((g) => g.savedMinor >= g.targetMinor).length,
    saved: fromMinor(saved),
    target: fromMinor(target),
    percent: pct(saved, target) ?? 0,
  };
}
