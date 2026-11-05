import { AlertTriangle } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';
import useFormat from '../../hooks/useFormat.js';
import { fmtPct } from '../../utils/format.js';

const BADGE = { ok: 'badge-income', warning: 'badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', exceeded: 'badge-expense', none: 'badge-neutral' };
const TEXT = { ok: 'On track', warning: 'Approaching limit', exceeded: 'Over budget', none: '' };

export default function BudgetProgress({ label, spent, limit, remaining, percent, status, large = false }) {
  const { money } = useFormat();
  return (
    <div className={large ? '' : 'rounded-xl border border-slate-200 p-4 dark:border-navy-800'}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className={`font-semibold text-navy-900 dark:text-white ${large ? 'text-base' : 'text-sm'}`}>{label}</h3>
        <span className={BADGE[status]}>{status === 'exceeded' || status === 'warning' ? <AlertTriangle size={12} className="mr-1" aria-hidden="true" /> : null}{TEXT[status]} · {fmtPct(percent)}</span>
      </div>
      <ProgressBar percent={percent} status={status} label={`${label} budget used`} height={large ? 'h-3' : 'h-2.5'} />
      <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>Spent <b className="text-slate-700 dark:text-slate-200">{money(spent)}</b> of {money(limit)}</span>
        <span className={remaining < 0 ? 'font-medium text-coral-600' : ''}>{remaining < 0 ? `${money(-remaining)} over` : `${money(remaining)} left`}</span>
      </div>
    </div>
  );
}
