import Transaction from '../models/Transaction.js';
import { totals, categoryBreakdown } from './summary.js';
import { budgetStatus } from './budget.js';
import { DISCRETIONARY } from '../utils/constants.js';
import { changePct, formatMoney, pct } from '../utils/money.js';
import { addDays, addMonths, daysBetween, fmtDay, monthKey, monthRange, previousPeriod } from '../utils/dates.js';

const DISCLAIMER = 'These insights are generated from your recorded transactions using simple rules. They are informational only and are not financial advice.';

// Recurring detection (ESTIMATED): same title+category, seen in >=3 distinct months of the last 6, with similar amounts.
async function detectRecurring(userId, to) {
  const start = monthRange(addMonths(monthKey(to), -5)).from;
  const rows = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start, $lte: to } } },
    { $group: {
        _id: { t: { $toLower: '$title' }, c: '$category' },
        title: { $first: '$title' },
        months: { $addToSet: { $dateToString: { format: '%Y-%m', date: '$date' } } },
        min: { $min: '$amountMinor' }, max: { $max: '$amountMinor' }, avg: { $avg: '$amountMinor' },
    } },
  ]);
  return rows
    .filter((r) => r.months.length >= 3 && r.max <= r.min * 1.18)
    .map((r) => ({ title: r.title, category: r._id.c, monthlyMinor: Math.round(r.avg), months: r.months.length }))
    .sort((a, b) => b.monthlyMinor - a.monthlyMinor);
}

export async function buildInsights(user, from, to) {
  const userId = user._id;
  const cur = user.preferences?.currency || 'INR';
  const m = (minor) => formatMoney(minor, cur);
  const prev = previousPeriod(from, to);
  const basisCur = `${fmtDay(from)} to ${fmtDay(to)}`;
  const basisPrev = `${fmtDay(prev.from)} to ${fmtDay(prev.to)}`;
  const period = { from: fmtDay(from), to: fmtDay(to), previous: { from: fmtDay(prev.from), to: fmtDay(prev.to) } };

  const [curT, prevT, curCats, prevCats] = await Promise.all([
    totals(userId, from, to), totals(userId, prev.from, prev.to),
    categoryBreakdown(userId, from, to), categoryBreakdown(userId, prev.from, prev.to),
  ]);

  if (curT.count === 0) {
    return { period, hasData: false, disclaimer: DISCLAIMER, insights: [{
      id: 'no-data', severity: 'info', title: 'Not enough data yet',
      message: 'There are no transactions in the selected period, so no insights can be generated. Add transactions or choose a wider date range.',
      basis: basisCur,
    }] };
  }

  const out = [];
  const inc = curT.incomeMinor, exp = curT.expenseMinor, net = inc - exp;

  // Income vs expenses + savings rate
  if (inc > 0) {
    const rate = pct(net, inc);
    out.push({
      id: 'savings-rate', severity: rate < 0 ? 'warning' : rate >= 20 ? 'positive' : 'info',
      title: `Savings rate: ${rate}%`,
      message: rate < 0
        ? `You spent ${m(-net)} more than you earned in this period (income ${m(inc)}, expenses ${m(exp)}).`
        : `You kept ${m(net)} of ${m(inc)} income (${rate}%) after ${m(exp)} of expenses.`,
      basis: `Savings rate = (income − expenses) ÷ income, for ${basisCur}.`,
    });
  } else {
    out.push({ id: 'no-income', severity: 'info', title: 'No income recorded',
      message: `Expenses of ${m(exp)} were recorded but no income, so a savings rate cannot be calculated.`, basis: basisCur });
  }
  out.push({
    id: 'income-vs-expense', severity: net >= 0 ? 'positive' : 'warning', title: 'Income versus expenses',
    message: `Income ${m(inc)} · Expenses ${m(exp)} · Net ${net < 0 ? '−' : ''}${m(Math.abs(net))}.`, basis: basisCur,
  });

  // Highest category & biggest expense
  if (curCats[0]) {
    out.push({ id: 'top-category', severity: 'info', title: `Highest spending: ${curCats[0].category}`,
      message: `${curCats[0].category} totals ${m(curCats[0].totalMinor)}, which is ${curCats[0].percent}% of your expenses.`, basis: basisCur });
  }
  const biggest = await Transaction.findOne({ user: userId, type: 'expense', date: { $gte: from, $lte: to } }).sort({ amountMinor: -1, date: -1 });
  if (biggest) {
    out.push({ id: 'biggest-expense', severity: 'info', title: 'Biggest single expense',
      message: `"${biggest.title}" (${biggest.category}) on ${fmtDay(biggest.date)} for ${m(biggest.amountMinor)}.`, basis: basisCur });
  }

  // Comparison with the previous period of equal length
  if (prevT.expenseMinor > 0) {
    const ch = changePct(exp, prevT.expenseMinor);
    out.push({ id: 'period-comparison', severity: ch > 10 ? 'warning' : ch < -10 ? 'positive' : 'info',
      title: `Spending ${ch >= 0 ? 'up' : 'down'} ${Math.abs(ch)}% vs previous period`,
      message: `You spent ${m(exp)} versus ${m(prevT.expenseMinor)} in the previous period of equal length.`,
      basis: `${basisCur} compared with ${basisPrev}.` });
    const prevMap = new Map(prevCats.map((c) => [c.category, c.totalMinor]));
    curCats
      .map((c) => ({ ...c, prev: prevMap.get(c.category) || 0 }))
      .filter((c) => c.prev > 0 && Math.abs(changePct(c.totalMinor, c.prev)) >= 15)
      .sort((a, b) => Math.abs(b.totalMinor - b.prev) - Math.abs(a.totalMinor - a.prev))
      .slice(0, 3)
      .forEach((c) => {
        const ch2 = changePct(c.totalMinor, c.prev);
        out.push({ id: `cat-change-${c.category}`, severity: ch2 > 0 ? 'warning' : 'positive',
          title: `${c.category} ${ch2 > 0 ? 'increased' : 'decreased'} ${Math.abs(ch2)}%`,
          message: `Your ${c.category.toLowerCase()} spending ${ch2 > 0 ? 'increased' : 'decreased'} by ${Math.abs(ch2)}% compared with the previous period (${m(c.totalMinor)} vs ${m(c.prev)}).`,
          basis: `${basisCur} compared with ${basisPrev}.` });
      });
  }

  // Unusual spending vs the 3 months before the period
  const hist = { from: monthRange(addMonths(monthKey(from), -3)).from, to: addDays(from, -1) };
  const histRows = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: hist.from, $lte: hist.to } } },
    { $group: { _id: { c: '$category', mo: { $dateToString: { format: '%Y-%m', date: '$date' } } }, total: { $sum: '$amountMinor' } } },
  ]);
  const histMonths = new Set(histRows.map((r) => r._id.mo));
  if (histMonths.size >= 2) {
    const scale = daysBetween(from, to) / 30.4375;
    const sums = new Map();
    histRows.forEach((r) => sums.set(r._id.c, (sums.get(r._id.c) || 0) + r.total));
    curCats.forEach((c) => {
      const hs = sums.get(c.category);
      if (!hs) return;
      const expected = (hs / histMonths.size) * scale;
      if (c.totalMinor > expected * 1.5 && c.totalMinor - expected >= exp * 0.1) {
        out.push({ id: `unusual-${c.category}`, severity: 'warning', title: `Unusually high ${c.category} spending`,
          message: `${c.category} spending of ${m(c.totalMinor)} is well above your usual level of about ${m(Math.round(expected))} for a period this long.`,
          basis: `Compared with your average monthly ${c.category} spending over the ${histMonths.size} months with data before ${fmtDay(from)}, scaled to ${daysBetween(from, to)} days.` });
      }
    });
  }

  // Budget risk (month of the period end)
  const bs = await budgetStatus(userId, monthKey(to));
  if (bs.budget) {
    const risky = [
      ...(bs.overall.limit ? [{ name: 'monthly', ...bs.overall }] : []),
      ...bs.categories.map((c) => ({ name: `monthly ${c.category.toLowerCase()}`, ...c })),
    ].filter((r) => r.status === 'warning' || r.status === 'exceeded');
    risky.forEach((r) => out.push({ id: `budget-${r.name}`, severity: r.status === 'exceeded' ? 'danger' : 'warning',
      title: r.status === 'exceeded' ? `Over ${r.name} budget` : `Approaching ${r.name} budget`,
      message: r.status === 'exceeded'
        ? `You have spent ${r.percent}% of your ${r.name} budget (${m(Math.round(r.spent * 100))} of ${m(Math.round(r.limit * 100))}).`
        : `You have used ${r.percent}% of your ${r.name} budget.`,
      basis: `Budget for ${bs.month}, based on recorded expenses in that month.` }));
  }

  // Discretionary spending suggestion
  const disc = curCats.filter((c) => DISCRETIONARY.includes(c.category));
  const discTotal = disc.reduce((a, c) => a + c.totalMinor, 0);
  if (exp > 0 && pct(discTotal, exp) >= 30) {
    out.push({ id: 'discretionary', severity: 'info', title: 'Discretionary spending is a large share',
      message: `${pct(discTotal, exp)}% of recorded expenses (${m(discTotal)}) are in flexible categories: ${disc.map((c) => c.category).join(', ')}. If you want to reduce spending, these are usually the easiest to adjust. Setting category budgets can help you track them.`,
      basis: `Share of expenses in ${DISCRETIONARY.join(', ')} for ${basisCur}.` });
  }

  // Subscriptions
  const subs = curCats.find((c) => c.category === 'Subscriptions');
  if (subs) {
    out.push({ id: 'subscriptions', severity: 'info', title: 'Subscriptions',
      message: `Your subscriptions account for ${m(subs.totalMinor)} in recorded expenses in this period (${subs.count} transaction${subs.count === 1 ? '' : 's'}).`, basis: basisCur });
  }

  // Recurring expenses (estimated)
  const rec = await detectRecurring(userId, to);
  if (rec.length) {
    const total = rec.reduce((a, r) => a + r.monthlyMinor, 0);
    out.push({ id: 'recurring', severity: 'info', title: 'Possible recurring expenses (estimated)',
      message: `${rec.length} expense${rec.length === 1 ? ' appears' : 's appear'} to repeat monthly, adding up to roughly ${m(total)} per month.`,
      items: rec.slice(0, 8).map((r) => ({ title: r.title, category: r.category, monthlyEstimate: r.monthlyMinor / 100, months: r.months })),
      basis: 'Estimated: same title and category in at least 3 of the last 6 months with similar amounts. Review these yourself; patterns can be coincidental.' });
  }

  return { period, hasData: true, disclaimer: DISCLAIMER, insights: out };
}
