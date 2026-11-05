import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CHART_COLORS } from '../../utils/constants.js';
import { dayLabel, monthLabel } from '../../utils/format.js';
import EmptyState from '../common/EmptyState.jsx';
import { BarChart3 } from 'lucide-react';

const GREEN = '#10b981';
const CORAL = '#f4586b';
const STATUS_FILL = { ok: GREEN, warning: '#f59e0b', exceeded: CORAL, none: '#94a3b8' };
const tick = { fill: 'currentColor', fontSize: 12 };

function Frame({ children, height = 'h-64', empty, emptyText = 'No data for this period yet.' }) {
  if (empty) return <EmptyState compact icon={BarChart3} title="Nothing to chart yet" message={emptyText} />;
  return <div className={`${height} w-full text-slate-500 dark:text-slate-400`}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}
function Tip({ active, payload, label, money, labelFormatter, extra }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200">
      <p className="mb-1 font-semibold">{labelFormatter ? labelFormatter(label) : (label ?? payload[0].name)}</p>
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} aria-hidden="true" />
          {p.name}: <b>{money(p.value)}</b>
        </p>
      ))}
      {extra && <p className="mt-1 text-slate-500">{extra(payload[0].payload)}</p>}
    </div>
  );
}
const grid = <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} vertical={false} />;
const xFmt = (granularity) => (granularity === 'day' ? dayLabel : monthLabel);

export function IncomeExpenseChart({ data, granularity, money, moneyCompact }) {
  const empty = !data.some((d) => d.income || d.expense);
  return (
    <Frame empty={empty} emptyText="Add income and expenses to see how they compare over time.">
      <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GREEN} stopOpacity={0.35} /><stop offset="95%" stopColor={GREEN} stopOpacity={0} /></linearGradient>
          <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CORAL} stopOpacity={0.35} /><stop offset="95%" stopColor={CORAL} stopOpacity={0} /></linearGradient>
        </defs>
        {grid}
        <XAxis dataKey="period" tickFormatter={xFmt(granularity)} tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis tickFormatter={moneyCompact} tick={tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<Tip money={money} labelFormatter={xFmt(granularity)} />} />
        <Area type="monotone" dataKey="income" name="Income" stroke={GREEN} strokeWidth={2} fill="url(#gInc)" />
        <Area type="monotone" dataKey="expense" name="Expenses" stroke={CORAL} strokeWidth={2} fill="url(#gExp)" />
      </AreaChart>
    </Frame>
  );
}

export function CategoryDonut({ data, money }) {
  const rows = data.map((d) => ({ name: d.category, value: d.total, percent: d.percent }));
  return (
    <div>
      <Frame height="h-52" empty={!rows.length} emptyText="Expense categories appear here once you record spending.">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="none">
            {rows.map((r, i) => <Cell key={r.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<Tip money={money} extra={(p) => `${p.percent}% of expenses`} />} />
        </PieChart>
      </Frame>
      {rows.length > 0 && (
        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
          {rows.slice(0, 8).map((r, i) => (
            <li key={r.name} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="truncate">{r.name}</span></span>
              <span className="shrink-0 font-medium tabular-nums">{r.percent}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MonthlyTrendChart({ data, money, moneyCompact }) {
  return (
    <Frame empty={!data.some((d) => d.expense)} emptyText="Monthly spending trends will show up here.">
      <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="period" tickFormatter={monthLabel} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={moneyCompact} tick={tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} content={<Tip money={money} labelFormatter={monthLabel} />} />
        <Bar dataKey="expense" name="Spending" fill={CORAL} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </Frame>
  );
}

// rows: [{ label, limit, spent, percent, status }]
export function BudgetUtilizationChart({ rows, money }) {
  const data = rows.map((r) => ({ ...r, shown: Math.min(r.percent ?? 0, 150) }));
  return (
    <Frame height={data.length > 4 ? 'h-72' : 'h-56'} empty={!data.length} emptyText="Create a budget for this month to track utilization.">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} horizontal={false} />
        <XAxis type="number" domain={[0, (max) => Math.max(100, Math.ceil(max / 25) * 25)]} tickFormatter={(v) => `${v}%`} tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={tick} axisLine={false} tickLine={false} width={92} />
        <Tooltip cursor={{ fill: 'currentColor', fillOpacity: 0.06 }}
          content={({ active, payload }) => active && payload?.length ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200">
              <p className="font-semibold">{payload[0].payload.label}</p>
              <p>{money(payload[0].payload.spent)} of {money(payload[0].payload.limit)} ({payload[0].payload.percent}%)</p>
            </div>) : null} />
        <Bar dataKey="shown" name="Used" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((r) => <Cell key={r.label} fill={STATUS_FILL[r.status] || GREEN} />)}
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function SavingsTrendChart({ data, granularity, money, moneyCompact }) {
  let run = 0;
  const rows = data.map((d) => { run = Math.round((run + d.savings) * 100) / 100; return { period: d.period, cumulative: run }; });
  return (
    <Frame empty={!data.some((d) => d.income || d.expense)} emptyText="Your cumulative savings (income − expenses) will appear here.">
      <LineChart data={rows} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="period" tickFormatter={xFmt(granularity)} tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis tickFormatter={moneyCompact} tick={tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<Tip money={money} labelFormatter={xFmt(granularity)} />} />
        <Line type="monotone" dataKey="cumulative" name="Cumulative savings" stroke="#3b619f" strokeWidth={2.5} dot={false} />
      </LineChart>
    </Frame>
  );
}

export function MonthlyBars({ data, money, moneyCompact }) {
  return (
    <Frame empty={!data.some((d) => d.income || d.expense)}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="period" tickFormatter={monthLabel} tick={tick} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={moneyCompact} tick={tick} axisLine={false} tickLine={false} width={56} />
        <Tooltip cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} content={<Tip money={money} labelFormatter={monthLabel} />} />
        <Bar dataKey="income" name="Income" fill={GREEN} radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Expenses" fill={CORAL} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </Frame>
  );
}
