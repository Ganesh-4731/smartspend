import { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import useAsync from '../hooks/useAsync.js';
import useFormat from '../hooks/useFormat.js';
import { budgetApi } from '../api/index.js';
import { getErrorMessage } from '../api/client.js';
import { currentMonthKey } from '../utils/dates.js';
import Modal from '../components/common/Modal.jsx';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import BudgetProgress from '../components/budgets/BudgetProgress.jsx';
import BudgetForm from '../components/budgets/BudgetForm.jsx';

function shiftMonth(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
const longMonth = (key) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); };

export default function Budgets() {
  const { money } = useFormat();
  const [month, setMonth] = useState(currentMonthKey());
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(() => budgetApi.status(month), [month]);
  const s = data?.data;

  const save = async (payload) => {
    if (s.budget) await budgetApi.update(s.budget.id, payload); else await budgetApi.create(payload);
    toast.success(s.budget ? 'Budget updated' : 'Budget created');
    setEditing(false);
    reload();
  };
  const remove = async () => {
    setBusy(true);
    try { await budgetApi.remove(s.budget.id); toast.success('Budget deleted'); setDeleting(false); reload(); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  const alerts = s?.budget ? [
    ...(s.overall.limit ? [{ name: 'overall monthly', ...s.overall }] : []),
    ...s.categories.map((c) => ({ name: c.category.toLowerCase(), ...c })),
  ].filter((a) => a.status === 'warning' || a.status === 'exceeded') : [];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="page-title">Budgets</h1><p className="text-sm text-slate-500 dark:text-slate-400">Each month has its own budget; spending is calculated from your real expenses.</p></div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-icon border border-slate-300 dark:border-navy-700" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <label className="sr-only" htmlFor="budget-month">Month</label>
          <input id="budget-month" type="month" className="input w-44" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button type="button" className="btn-icon border border-slate-300 dark:border-navy-700" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading && !s ? <LoadingSpinner label="Loading budget…" /> : error && !s ? <ErrorState message={error} onRetry={reload} /> : s && (
        <div className={loading ? 'opacity-70' : ''}>
          {!s.budget ? (
            <div className="card">
              <EmptyState icon={Wallet} title={`No budget for ${longMonth(month)}`}
                message={s.overall.spent > 0 ? `You have spent ${money(s.overall.spent)} this month with no budget set. Create one to track your limits.` : 'Set a monthly limit and per-category limits to stay on top of your spending.'}
                action={<button type="button" className="btn-primary" onClick={() => setEditing(true)}><Plus size={16} />Create budget</button>} />
            </div>
          ) : (
            <>
              {alerts.length > 0 && (
                <div role="alert" className="mb-4 space-y-2">
                  {alerts.map((a) => (
                    <div key={a.name} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${a.status === 'exceeded' ? 'border-coral-200 bg-coral-50 text-coral-700 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-400' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                      <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{a.status === 'exceeded' ? `You have exceeded your ${a.name} budget` : `You have used ${a.percent}% of your ${a.name} budget`} ({money(a.spent)} of {money(a.limit)}).</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setEditing(true)}><Pencil size={16} />Edit budget</button>
                <button type="button" className="btn-secondary hover:!text-coral-600" onClick={() => setDeleting(true)}><Trash2 size={16} />Delete</button>
              </div>
              {s.overall.limit && <div className="card mb-4"><BudgetProgress large label={`Overall budget — ${longMonth(month)}`} {...s.overall} /></div>}
              {s.categories.length > 0 && (
                <div className="mb-4"><h2 className="mb-3 font-semibold text-navy-900 dark:text-white">Category budgets</h2>
                  <div className="grid gap-3 md:grid-cols-2">{s.categories.map((c) => <BudgetProgress key={c.category} label={c.category} {...c} />)}</div></div>
              )}
              {s.unbudgeted.length > 0 && (
                <div className="card"><h2 className="mb-1 font-semibold text-navy-900 dark:text-white">Spending without a category limit</h2>
                  <p className="mb-3 text-xs text-slate-500">Included in the overall total, but not tied to a category budget.</p>
                  <ul className="divide-y divide-slate-100 text-sm dark:divide-navy-800">{s.unbudgeted.map((u) => <li key={u.category} className="flex justify-between py-2"><span>{u.category}</span><b className="tabular-nums">{money(u.spent)}</b></li>)}</ul></div>
              )}
            </>
          )}
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={s?.budget ? `Edit budget — ${longMonth(month)}` : `Create budget — ${longMonth(month)}`}>
        {editing && s && <BudgetForm budget={s.budget} month={month} onSubmit={save} onCancel={() => setEditing(false)} />}
      </Modal>
      <ConfirmationDialog open={deleting} loading={busy} title="Delete this budget?" message={`The budget for ${longMonth(month)} will be removed. Your transactions are not affected.`} onCancel={() => setDeleting(false)} onConfirm={remove} />
    </div>
  );
}
