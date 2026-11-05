import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { fromMinor, pct } from '../utils/money.js';
import { monthRange } from '../utils/dates.js';

export const statusOf = (percent) => (percent == null ? 'none' : percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok');

function line(limitMinor, spentMinor) {
  const percent = limitMinor ? pct(spentMinor, limitMinor) : null;
  return {
    limit: limitMinor ? fromMinor(limitMinor) : null,
    spent: fromMinor(spentMinor),
    remaining: limitMinor ? fromMinor(limitMinor - spentMinor) : null, // negative when overspent
    percent,
    status: statusOf(percent),
  };
}

// Spending is always derived from the month's real expense transactions. The overall figure is the total of ALL
// expenses in the month (not the sum of category lines), so nothing is counted twice or missed.
export async function budgetStatus(userId, month) {
  const budget = await Budget.findOne({ user: userId, month });
  const { from, to } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: from, $lte: to } } },
    { $group: { _id: '$category', spent: { $sum: '$amountMinor' } } },
  ]);
  const byCat = new Map(rows.map((r) => [r._id, r.spent]));
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);
  const limited = new Set((budget?.categoryLimits || []).map((c) => c.category));
  return {
    month,
    budget: budget ? budget.toJSON() : null,
    overall: line(budget?.overallLimitMinor || null, totalSpent),
    categories: (budget?.categoryLimits || []).map((c) => ({ category: c.category, ...line(c.limitMinor, byCat.get(c.category) || 0) })),
    unbudgeted: rows
      .filter((r) => !limited.has(r._id))
      .sort((a, b) => b.spent - a.spent)
      .map((r) => ({ category: r._id, spent: fromMinor(r.spent) })),
  };
}
