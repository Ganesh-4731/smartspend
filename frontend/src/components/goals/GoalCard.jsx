import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, PiggyBank, Trash2 } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';
import useFormat from '../../hooks/useFormat.js';
import { fmtPct } from '../../utils/format.js';

const DAY = 86400000;

export default function GoalCard({ goal, onContribute, onEdit, onDelete, onDeleteContribution }) {
  const { money, date } = useFormat();
  const [open, setOpen] = useState(false);
  const now = Date.now();
  const target = new Date(goal.targetDate).getTime();
  const start = new Date(goal.createdAt).getTime();
  const daysLeft = Math.ceil((target - now) / DAY);
  const timePct = target > start ? Math.max(0, Math.min(((now - start) / (target - start)) * 100, 100)) : 100;
  const behind = !goal.completed && daysLeft >= 0 && goal.percent + 0.5 < timePct;
  const overdue = !goal.completed && daysLeft < 0;

  return (
    <article className="card flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold text-navy-900 dark:text-white">
            {goal.completed ? <CheckCircle2 size={18} className="shrink-0 text-emerald-500" aria-label="Completed" /> : <PiggyBank size={18} className="shrink-0 text-navy-500" aria-hidden="true" />}
            <span className="truncate">{goal.title}</span>
          </h3>
          {goal.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{goal.description}</p>}
        </div>
        <div className="flex shrink-0">
          <button type="button" className="btn-icon h-9 w-9" onClick={() => onEdit(goal)} aria-label={`Edit ${goal.title}`}><Pencil size={16} /></button>
          <button type="button" className="btn-icon h-9 w-9 hover:text-coral-600" onClick={() => onDelete(goal)} aria-label={`Delete ${goal.title}`}><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="mb-1 flex items-end justify-between">
        <span className="text-xl font-bold text-navy-900 dark:text-white">{money(goal.saved)}</span>
        <span className="text-sm text-slate-500">of {money(goal.target)}</span>
      </div>
      <ProgressBar percent={goal.percent} status={goal.completed ? 'ok' : 'ok'} label={`${goal.title} progress`} />
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-slate-500 dark:text-slate-400">
        <span>{fmtPct(goal.percent)} complete</span>
        <span>{goal.completed ? 'Goal reached 🎉' : `${money(goal.remaining)} remaining`}</span>
      </div>
      <p className={`mt-3 text-xs ${overdue ? 'text-coral-600' : behind ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
        Target {date(goal.targetDate)}
        {!goal.completed && (overdue ? ` · ${Math.abs(daysLeft)} days past target date` : ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left${behind ? ' · behind the time elapsed' : ''}`)}
      </p>
      <div className="mt-4 flex items-center gap-2">
        {!goal.completed && <button type="button" className="btn-primary flex-1" onClick={() => onContribute(goal)}>Add contribution</button>}
        <button type="button" className="btn-secondary" onClick={() => setOpen(!open)} aria-expanded={open}>{goal.contributions.length} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      {open && (
        <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-navy-800">
          {goal.contributions.length === 0 && <li className="py-2 text-slate-500">No contributions yet.</li>}
          {goal.contributions.slice(0, 20).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0"><b className="tabular-nums">{money(c.amount)}</b> <span className="text-xs text-slate-500">{date(c.date)}{c.note ? ` · ${c.note}` : ''}</span></span>
              <button type="button" className="btn-icon h-8 w-8 hover:text-coral-600" onClick={() => onDeleteContribution(goal, c)} aria-label="Remove contribution"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
