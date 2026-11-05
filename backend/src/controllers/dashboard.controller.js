import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/AppError.js';
import { resolveRange, previousPeriod, monthKey } from '../utils/dates.js';
import { changePct, fromMinor, pct } from '../utils/money.js';
import { totals, balanceMinor, series, categoryBreakdown, granularityFor, goalsSummary } from '../services/summary.js';
import { budgetStatus } from '../services/budget.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  const { from, to } = resolveRange(req.valid.query);
  const prev = previousPeriod(from, to);
  const gran = granularityFor(from, to);

  const [cur, prv, bal, ser, monthly, cats, budget, goals, recent, allCount] = await Promise.all([
    totals(user._id, from, to),
    totals(user._id, prev.from, prev.to),
    balanceMinor(user),
    series(user._id, from, to, gran),
    series(user._id, from, to, 'month'),
    categoryBreakdown(user._id, from, to, 'expense'),
    budgetStatus(user._id, monthKey(to)),
    goalsSummary(user._id),
    Transaction.find({ user: user._id }).sort({ date: -1, _id: -1 }).limit(8),
    Transaction.countDocuments({ user: user._id }),
  ]);

  const savingsMinor = cur.incomeMinor - cur.expenseMinor;
  const prevSavings = prv.incomeMinor - prv.expenseMinor;
  res.json({ success: true, data: {
    range: { from: req.valid.query.from || from.toISOString().slice(0, 10), to: req.valid.query.to || to.toISOString().slice(0, 10), granularity: gran },
    hasTransactions: allCount > 0,
    cards: {
      balance: fromMinor(bal),
      income: fromMinor(cur.incomeMinor),
      expenses: fromMinor(cur.expenseMinor),
      savings: fromMinor(savingsMinor),
      savingsRate: pct(savingsMinor, cur.incomeMinor), // null when no income
      budget: { month: budget.month, hasBudget: !!budget.budget, limit: budget.overall.limit, spent: budget.overall.spent, percent: budget.overall.percent, status: budget.overall.status },
      changes: {
        income: changePct(cur.incomeMinor, prv.incomeMinor),
        expenses: changePct(cur.expenseMinor, prv.expenseMinor),
        savings: prevSavings > 0 ? changePct(savingsMinor, prevSavings) : null,
      },
    },
    series: ser,
    monthly,
    categories: cats.map(({ totalMinor, ...c }) => c),
    budgetUtilization: budget.categories,
    goals,
    recent,
  } });
});
