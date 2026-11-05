import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormTextarea } from '../common/Field.jsx';
import { contributionFormSchema, goalFormSchema } from '../../utils/schemas.js';
import { todayStr } from '../../utils/dates.js';
import { dayOf } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';
import useFormat from '../../hooks/useFormat.js';

function useSubmit(setError, onSubmit) {
  const [formError, setFormError] = useState('');
  const submit = async (values) => {
    setFormError('');
    try { await onSubmit(values); } catch (e) {
      getFieldErrors(e).forEach((fe) => setError(fe.field, { message: fe.message }));
      setFormError(getErrorMessage(e));
    }
  };
  return [formError, submit];
}
const ErrorBanner = ({ message }) => message ? <div role="alert" className="rounded-xl bg-coral-50 px-3 py-2 text-sm text-coral-700 dark:bg-coral-500/10 dark:text-coral-400">{message}</div> : null;

export function GoalForm({ goal, onSubmit, onCancel }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goal ? { title: goal.title, description: goal.description || '', target: goal.target, targetDate: dayOf(goal.targetDate) } : { title: '', description: '', target: '', targetDate: '' },
  });
  const [formError, submit] = useSubmit(setError, onSubmit);
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <ErrorBanner message={formError} />
      <FormInput label="Goal title" maxLength={100} error={errors.title?.message} {...register('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput label="Target amount" type="number" step="0.01" min="0" inputMode="decimal" error={errors.target?.message} {...register('target')} />
        <FormInput label="Target date" type="date" error={errors.targetDate?.message} {...register('targetDate')} />
      </div>
      <FormTextarea label="Description (optional)" maxLength={500} error={errors.description?.message} {...register('description')} />
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : goal ? 'Save goal' : 'Create goal'}</button>
      </div>
    </form>
  );
}

export function ContributionForm({ goal, onSubmit, onCancel }) {
  const { money } = useFormat();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contributionFormSchema), defaultValues: { amount: '', date: todayStr(), note: '' },
  });
  const [formError, submit] = useSubmit(setError, onSubmit);
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <ErrorBanner message={formError} />
      <p className="text-sm text-slate-600 dark:text-slate-300">Remaining to reach <b>{goal.title}</b>: <b>{money(goal.remaining)}</b>. Contributions are tracked on the goal only — they are not recorded as expenses.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput label="Amount" type="number" step="0.01" min="0" inputMode="decimal" error={errors.amount?.message} {...register('amount')} />
        <FormInput label="Date" type="date" error={errors.date?.message} {...register('date')} />
      </div>
      <FormInput label="Note (optional)" maxLength={200} error={errors.note?.message} {...register('note')} />
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Add contribution'}</button>
      </div>
    </form>
  );
}
