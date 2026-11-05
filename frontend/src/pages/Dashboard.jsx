import { Link } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, Landmark, PiggyBank, Plus, Target, Wallet } from 'lucide-react';
import useAsync from '../hooks/useAsync.js';
import useDateRange from '../hooks/useDateRange.js';
import useFormat from '../hooks/useFormat.js';
import { dashboardApi } from '../api/index.js';
import DateRangeFilter from '../components/common/DateRangeFilter.jsx';
import StatCard from '../components/common/StatCard.jsx';
import ChartCard from '../components/common/ChartCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import TransactionTable from '../components/transactions/TransactionTable.jsx';
import { BudgetUtilizationChart, CategoryDonut, IncomeExpenseChart, MonthlyTrendChart, SavingsTrendChart } from '../components/dashboard/Charts.jsx';
import { fmtPct, monthLabel } from '../utils/format.js';

export default function Dashboard() {
  const range = useDateRange('thisMonth');
  const { money, moneyCompact } = useFormat();
  const { data, loading, error, reload } = useAsync(() => (range.valid ? dashboardApi.get(range.params) : Promise.resolve(null)), [range.params.from, range.params.to, range.valid]);
  const d = data?.data;

  const header = (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="page-title">Dashboard</h1><p className="text-sm text-slate-500 dark:text-slate-400">Your financial overview for the selected period.</p></div>
      <DateRangeFilter value={range.value} onPresetChange={range.onPresetChange} onCustomChange={range.onCustomChange} />
    </div>
  );
  if (!range.valid) return <>{header}<ErrorState message="Choose a valid date range (the end date must not be before the start date)." /></>;
  if (loading && !d) return <>{header}<LoadingSpinner label="Loading dashboard…" /></>;
  if (error && !d) return <>{header}<ErrorState message={error} onRetry={reload} /></>;
  if (!d) return header;

  const { cards } = d;
  const b = cards.budget;
  const budgetRows = [
    ...(b.hasBudget && b.limit ? [{ label: 'Overall', limit: b.limit, spent: b.spent, percent: b.percent, status: b.status }] : []),
    ...d.budgetUtilization.map((c) => ({ label: c.category, limit: c.limit, spent: c.spent, percent: c.percent, status: c.status })),
  ];

  return (
    <div className={loading ? 'opacity-70 transition-opacity' : ''}>
      {header}
      {!d.hasTransactions && (
        <div className="card mb-6 border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <EmptyState icon={Wallet} title="Welcome to SmartSpend!" message="Add your first income or expense to light up your dashboard. You can also set a monthly budget and savings goals."
            action={<div className="flex flex-wrap justify-center gap-3"><Link to="/transactions?new=1" className="btn-primary"><Plus size={16} />Add first transaction</Link><Link to="/budgets" className="btn-secondary">Set a budget</Link></div>} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total balance" value={money(cards.balance)} icon={Landmark} tone="navy" sub="Opening balance + all income − expenses to date" />
        <StatCard label="Income" value={money(cards.income)} icon={ArrowDownCircle} tone="green" change={cards.changes.income} />
        <StatCard label="Expenses" value={money(cards.expenses)} icon={ArrowUpCircle} tone="red" change={cards.changes.expenses} invert />
        <StatCard label="Savings" value={money(cards.savings)} icon={PiggyBank} tone={cards.savings >= 0 ? 'green' : 'red'} change={cards.changes.savings}
          valueClass={cards.savings < 0 ? '!text-coral-600' : ''} sub={`Savings rate: ${fmtPct(cards.savingsRate)}`} />
        <StatCard label={`Budget used (${monthLabel(b.month)})`} value={b.hasBudget && b.limit ? fmtPct(b.percent) : 'No budget'} icon={Wallet}
          tone={b.status === 'exceeded' ? 'red' : b.status === 'warning' ? 'amber' : 'green'}
          sub={b.hasBudget && b.limit ? `${money(b.spent)} of ${money(b.limit)}` : <Link to="/budgets" className="font-medium text-emerald-600 hover:underline">Create a monthly budget</Link>} />
        <StatCard label="Savings goals" value={d.goals.count ? fmtPct(d.goals.percent) : 'No goals'} icon={Target} tone="navy"
          sub={d.goals.count ? `${money(d.goals.saved)} of ${money(d.goals.target)} · ${d.goals.completed} completed` : <Link to="/goals" className="font-medium text-emerald-600 hover:underline">Create your first goal</Link>} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Income vs expenses" subtitle={`Grouped by ${d.range.granularity}`}>
          <IncomeExpenseChart data={d.series} granularity={d.range.granularity} money={money} moneyCompact={moneyCompact} />
        </ChartCard>
        <ChartCard title="Expense breakdown" subtitle="By category"><CategoryDonut data={d.categories} money={money} /></ChartCard>
        <ChartCard title="Monthly spending trend"><MonthlyTrendChart data={d.monthly} money={money} moneyCompact={moneyCompact} /></ChartCard>
        <ChartCard title="Budget utilization" subtitle={`Budget for ${monthLabel(b.month)}`}><BudgetUtilizationChart rows={budgetRows} money={money} /></ChartCard>
        <ChartCard title="Savings trend" subtitle="Cumulative income − expenses in period">
          <SavingsTrendChart data={d.series} granularity={d.range.granularity} money={money} moneyCompact={moneyCompact} />
        </ChartCard>
      </div>

      <section className="card mt-6 !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <h2 className="font-semibold text-navy-900 dark:text-white">Recent transactions</h2>
          <div className="flex gap-2"><Link to="/transactions?new=1" className="btn-primary"><Plus size={16} />Add</Link><Link to="/transactions" className="btn-secondary">View all</Link></div>
        </div>
        {d.recent.length ? <TransactionTable items={d.recent} compact /> : <EmptyState compact title="No transactions yet" message="Your latest income and expenses will be listed here." />}
      </section>
    </div>
  );
}
