import { TrendingDown, TrendingUp } from 'lucide-react';

const TONES = {
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  red: 'bg-coral-50 text-coral-600 dark:bg-coral-500/10 dark:text-coral-400',
  navy: 'bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

// change: percentage vs previous period (null = not meaningful). invert: an increase is "bad" (e.g. expenses).
export default function StatCard({ label, value, icon: Icon, tone = 'navy', change, invert = false, hint, sub, valueClass = '' }) {
  const hasChange = change !== null && change !== undefined;
  const good = hasChange && (invert ? change <= 0 : change >= 0);
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`mt-1 truncate text-xl font-bold text-navy-900 sm:text-2xl dark:text-white ${valueClass}`} title={String(value)}>{value}</p>
        </div>
        {Icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}><Icon size={20} aria-hidden="true" /></span>}
      </div>
      <div className="mt-3 flex min-h-[20px] items-center gap-2 text-xs">
        {hasChange && (
          <span className={`inline-flex items-center gap-1 font-medium ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-coral-600 dark:text-coral-400'}`}>
            {change >= 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
        {(hint || hasChange) && <span className="text-slate-500 dark:text-slate-400">{hasChange ? (hint || 'vs previous period') : hint}</span>}
      </div>
      {sub && <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}
