import { ArrowDownCircle, ArrowUpCircle, BarChart3, Download, PiggyBank } from 'lucide-react';
import useAsync from '../hooks/useAsync.js';
import useDateRange from '../hooks/useDateRange.js';
import useFormat from '../hooks/useFormat.js';
import { reportApi } from '../api/index.js';
import { downloadCsv } from '../utils/csv.js';
import { fmtPct, monthLabel } from '../utils/format.js';
import DateRangeFilter from '../components/common/DateRangeFilter.jsx';
import StatCard from '../components/common/StatCard.jsx';
import ChartCard from '../components/common/ChartCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { CategoryDonut, MonthlyBars, SavingsTrendChart } from '../components/dashboard/Charts.jsx';

export default function Reports() {
  const range = useDateRange('last6');
  const { money, moneyCompact } = useFormat();
  const { data, loading, error, reload } = useAsync(() => (range.valid ? reportApi.get(range.params) : Promise.resolve(null)), [range.params.from, range.params.to, range.valid]);
  const r = data?.data;

  const exportMonthly = () => downloadCsv(`monthly-report_${r.range.from}_${r.range.to}.csv`, [
    { header: 'Month', value: 'month' }, { header: 'Income', value: (x) => x.income.toFixed(2) }, { header: 'Expenses', value: (x) => x.expense.toFixed(2) },
    { header: 'Savings', value: (x) => x.savings.toFixed(2) }, { header: 'Savings rate %', value: (x) => x.savingsRate ?? '' }, { header: 'Cumulative savings', value: (x) => x.cumulativeSavings.toFixed(2) },
  ], r.monthly);
  const exportCategories = () => downloadCsv(`category-report_${r.range.from}_${r.range.to}.csv`, [
    { header: 'Type', value: 'type' }, { header: 'Category', value: 'category' }, { header: 'Total', value: (x) => x.total.toFixed(2) }, { header: 'Share %', value: (x) => x.percent ?? '' }, { header: 'Transactions', value: 'count' },
  ], [...r.expenseCategories.map((c) => ({ ...c, type: 'expense' })), ...r.incomeCategories.map((c) => ({ ...c, type: 'income' }))]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="page-title">Reports</h1><p className="text-sm text-slate-500 dark:text-slate-400">Monthly, category and savings reports for any period.</p></div>
        <DateRangeFilter value={range.value} onPresetChange={range.onPresetChange} onCustomChange={range.onCustomChange} />
      </div>
      {!range.valid ? <ErrorState message="Choose a valid date range." />
        : loading && !r ? <LoadingSpinner label="Building report…" />
        : error && !r ? <ErrorState message={error} onRetry={reload} />
        : r && (
          <div className={loading ? 'opacity-70' : ''}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total income" value={money(r.summary.income)} icon={ArrowDownCircle} tone="green" />
              <StatCard label="Total expenses" value={money(r.summary.expenses)} icon={ArrowUpCircle} tone="red" />
              <StatCard label="Net savings" value={money(r.summary.savings)} icon={PiggyBank} tone={r.summary.savings >= 0 ? 'green' : 'red'} />
              <StatCard label="Savings rate" value={fmtPct(r.summary.savingsRate)} icon={BarChart3} tone="navy" sub={`${r.summary.transactions} transactions`} />
            </div>
            {r.summary.transactions === 0 ? (
              <div className="card mt-6"><EmptyState icon={BarChart3} title="No data in this period" message="Pick a wider date range or add transactions to generate reports." /></div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Monthly income & expenses"><MonthlyBars data={r.monthly} money={money} moneyCompact={moneyCompact} /></ChartCard>
                  <ChartCard title="Savings report" subtitle="Cumulative savings by month"><SavingsTrendChart data={r.monthly} granularity="month" money={money} moneyCompact={moneyCompact} /></ChartCard>
                  <ChartCard title="Expenses by category"><CategoryDonut data={r.expenseCategories} money={money} /></ChartCard>
                  <ChartCard title="Category totals" action={<button type="button" className="btn-secondary" onClick={exportCategories}><Download size={16} />CSV</button>}>
                    <div className="max-h-80 overflow-auto">
                      <table className="w-full min-w-[320px] text-sm">
                        <thead><tr><th className="th px-2">Category</th><th className="th px-2 text-right">Total</th><th className="th px-2 text-right">Share</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                          {r.expenseCategories.map((c) => <tr key={`e-${c.category}`}><td className="px-2 py-2">{c.category} <span className="badge-expense ml-1">expense</span></td><td className="px-2 py-2 text-right tabular-nums">{money(c.total)}</td><td className="px-2 py-2 text-right tabular-nums">{fmtPct(c.percent)}</td></tr>)}
                          {r.incomeCategories.map((c) => <tr key={`i-${c.category}`}><td className="px-2 py-2">{c.category} <span className="badge-income ml-1">income</span></td><td className="px-2 py-2 text-right tabular-nums">{money(c.total)}</td><td className="px-2 py-2 text-right tabular-nums">{fmtPct(c.percent)}</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                </div>
                <section className="card mt-6 !p-0">
                  <div className="flex items-center justify-between p-4 sm:p-5"><h2 className="font-semibold text-navy-900 dark:text-white">Monthly breakdown</h2>
                    <button type="button" className="btn-secondary" onClick={exportMonthly}><Download size={16} />Export CSV</button></div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="border-y border-slate-200 dark:border-navy-800"><tr>
                        <th className="th">Month</th><th className="th text-right">Income</th><th className="th text-right">Expenses</th><th className="th text-right">Savings</th><th className="th text-right">Rate</th><th className="th text-right">Cumulative</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                        {r.monthly.map((m) => (
                          <tr key={m.month}><td className="td font-medium">{monthLabel(m.month)}</td>
                            <td className="td text-right tabular-nums text-emerald-600">{money(m.income)}</td>
                            <td className="td text-right tabular-nums text-coral-600">{money(m.expense)}</td>
                            <td className={`td text-right tabular-nums ${m.savings < 0 ? 'text-coral-600' : ''}`}>{money(m.savings)}</td>
                            <td className="td text-right tabular-nums">{fmtPct(m.savingsRate)}</td>
                            <td className="td text-right tabular-nums">{money(m.cumulativeSavings)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
    </div>
  );
}
