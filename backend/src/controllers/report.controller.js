import { asyncHandler } from '../utils/AppError.js';
import { resolveRange } from '../utils/dates.js';
import { fromMinor, pct } from '../utils/money.js';
import { series, categoryBreakdown, totals } from '../services/summary.js';

export const getReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveRange(req.valid.query);
  const [monthly, expenseCategories, incomeCategories, t] = await Promise.all([
    series(req.user._id, from, to, 'month'),
    categoryBreakdown(req.user._id, from, to, 'expense'),
    categoryBreakdown(req.user._id, from, to, 'income'),
    totals(req.user._id, from, to),
  ]);
  let running = 0;
  const monthlyRows = monthly.map((m) => {
    running = Math.round((running + m.savings) * 100) / 100;
    return { ...m, month: m.period, savingsRate: m.income > 0 ? pct(m.savings, m.income) : null, cumulativeSavings: running };
  });
  const net = t.incomeMinor - t.expenseMinor;
  res.json({ success: true, data: {
    range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    summary: { income: fromMinor(t.incomeMinor), expenses: fromMinor(t.expenseMinor), savings: fromMinor(net), savingsRate: pct(net, t.incomeMinor), transactions: t.count },
    monthly: monthlyRows,
    expenseCategories: expenseCategories.map(({ totalMinor, ...c }) => c),
    incomeCategories: incomeCategories.map(({ totalMinor, ...c }) => c),
  } });
});
