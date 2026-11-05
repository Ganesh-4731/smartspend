import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Target } from 'lucide-react';
import useAsync from '../hooks/useAsync.js';
import { goalApi } from '../api/index.js';
import { getErrorMessage } from '../api/client.js';
import Modal from '../components/common/Modal.jsx';
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import GoalCard from '../components/goals/GoalCard.jsx';
import { ContributionForm, GoalForm } from '../components/goals/GoalForms.jsx';

export default function Goals() {
  const { data, loading, error, reload } = useAsync(() => goalApi.list(), []);
  const [editing, setEditing] = useState(null); // 'new' | goal
  const [contributing, setContributing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [removingContribution, setRemovingContribution] = useState(null); // { goal, c }
  const [busy, setBusy] = useState(false);
  const goals = data?.data || [];
  const active = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);

  const saveGoal = async (v) => {
    const payload = { title: v.title, description: v.description || '', target: v.target, targetDate: v.targetDate };
    if (editing === 'new') await goalApi.create(payload); else await goalApi.update(editing.id, payload);
    toast.success(editing === 'new' ? 'Goal created' : 'Goal updated');
    setEditing(null); reload();
  };
  const contribute = async (v) => {
    await goalApi.contribute(contributing.id, { amount: v.amount, date: v.date, note: v.note || '' });
    toast.success('Contribution added');
    setContributing(null); reload();
  };
  const run = async (fn, okMsg, close) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); close(null); reload(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="page-title">Savings goals</h1><p className="text-sm text-slate-500 dark:text-slate-400">Set targets and record contributions. Contributions don't change your income or expense totals.</p></div>
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />New goal</button>
      </div>
      {loading && !data ? <LoadingSpinner label="Loading goals…" /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : goals.length === 0 ? (
        <div className="card"><EmptyState icon={Target} title="No savings goals yet" message="Create a goal — a trip, an emergency fund, a new laptop — and track your progress." action={<button type="button" className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Create your first goal</button>} /></div>
      ) : (
        <>
          {active.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{active.map((g) => (
            <GoalCard key={g.id} goal={g} onContribute={setContributing} onEdit={setEditing} onDelete={setDeleting} onDeleteContribution={(goal, c) => setRemovingContribution({ goal, c })} />))}</div>}
          {done.length > 0 && (<><h2 className="mb-3 mt-8 font-semibold text-navy-900 dark:text-white">Completed goals</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{done.map((g) => (
              <GoalCard key={g.id} goal={g} onContribute={setContributing} onEdit={setEditing} onDelete={setDeleting} onDeleteContribution={(goal, c) => setRemovingContribution({ goal, c })} />))}</div></>)}
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New savings goal' : 'Edit goal'}>
        {editing && <GoalForm goal={editing === 'new' ? null : editing} onSubmit={saveGoal} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={!!contributing} onClose={() => setContributing(null)} title="Add contribution">
        {contributing && <ContributionForm goal={contributing} onSubmit={contribute} onCancel={() => setContributing(null)} />}
      </Modal>
      <ConfirmationDialog open={!!deleting} loading={busy} title="Delete goal?" message={deleting ? `"${deleting.title}" and its contribution history will be permanently deleted.` : ''}
        onCancel={() => setDeleting(null)} onConfirm={() => run(() => goalApi.remove(deleting.id), 'Goal deleted', setDeleting)} />
      <ConfirmationDialog open={!!removingContribution} loading={busy} title="Remove contribution?" confirmLabel="Remove" message="The saved amount for this goal will be reduced accordingly."
        onCancel={() => setRemovingContribution(null)} onConfirm={() => run(() => goalApi.removeContribution(removingContribution.goal.id, removingContribution.c.id), 'Contribution removed', setRemovingContribution)} />
    </div>
  );
}
