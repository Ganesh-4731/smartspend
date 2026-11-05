import { AlertTriangle, CheckCircle2, Info, OctagonAlert, Repeat } from 'lucide-react';
import useFormat from '../../hooks/useFormat.js';

const STYLES = {
  positive: { icon: CheckCircle2, box: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5', ic: 'text-emerald-600' },
  info: { icon: Info, box: 'border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900', ic: 'text-navy-500 dark:text-navy-300' },
  warning: { icon: AlertTriangle, box: 'border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5', ic: 'text-amber-600' },
  danger: { icon: OctagonAlert, box: 'border-coral-200 bg-coral-50/70 dark:border-coral-500/20 dark:bg-coral-500/5', ic: 'text-coral-600' },
};

export default function InsightCard({ insight }) {
  const { money } = useFormat();
  const st = STYLES[insight.severity] || STYLES.info;
  const Icon = insight.id === 'recurring' ? Repeat : st.icon;
  return (
    <article className={`rounded-2xl border p-4 sm:p-5 ${st.box}`}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 shrink-0 ${st.ic}`} size={20} aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-semibold text-navy-900 dark:text-white">{insight.title}</h3>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{insight.message}</p>
          {insight.items?.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-200/70 text-sm dark:divide-navy-700">
              {insight.items.map((it) => (
                <li key={`${it.title}-${it.category}`} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0 truncate">{it.title} <span className="badge-neutral ml-1">{it.category}</span></span>
                  <span className="tabular-nums text-slate-600 dark:text-slate-300">≈ {money(it.monthlyEstimate)}/mo · {it.months} of last 6 months</span>
                </li>
              ))}
            </ul>
          )}
          {insight.basis && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400"><span className="font-medium">How this is calculated:</span> {insight.basis}</p>}
        </div>
      </div>
    </article>
  );
}
