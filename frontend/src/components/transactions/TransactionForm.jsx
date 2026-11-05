import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormSelect, FormTextarea } from '../common/Field.jsx';
import { transactionFormSchema } from '../../utils/schemas.js';
import { categoriesFor, PAYMENT_METHODS } from '../../utils/constants.js';
import { todayStr } from '../../utils/dates.js';
import { dayOf } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';

export default function TransactionForm({ initial, onSubmit, onCancel }) {
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initial
      ? { title: initial.title, amount: initial.amount, type: initial.type, category: initial.category, date: dayOf(initial.date),
          paymentMethod: initial.paymentMethod, notes: initial.notes || '', tagsText: (initial.tags || []).join(', ') }
      : { title: '', amount: '', type: 'expense', category: 'Food', date: todayStr(), paymentMethod: 'UPI', notes: '', tagsText: '' },
  });
  const type = watch('type');

  const chooseType = (t) => {
    setValue('type', t, { shouldValidate: false });
    if (!categoriesFor(t).includes(watch('category'))) setValue('category', categoriesFor(t)[0]);
  };
  const submit = async (v) => {
    setFormError('');
    try {
      await onSubmit({
        title: v.title, amount: v.amount, type: v.type, category: v.category, date: v.date, paymentMethod: v.paymentMethod,
        notes: v.notes || '', tags: (v.tagsText || '').split(',').map((t) => t.trim()).filter(Boolean),
      });
    } catch (e) {
      getFieldErrors(e).forEach((fe) => setError(fe.field === 'tags' ? 'tagsText' : fe.field, { message: fe.message }));
      setFormError(getErrorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {formError && <div role="alert" className="rounded-xl bg-coral-50 px-3 py-2 text-sm text-coral-700 dark:bg-coral-500/10 dark:text-coral-400">{formError}</div>}
      <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-navy-800">
        {['expense', 'income'].map((t) => (
          <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => chooseType(t)}
            className={`min-h-[40px] rounded-lg text-sm font-medium capitalize transition-colors ${type === t
              ? (t === 'income' ? 'bg-emerald-600 text-white' : 'bg-coral-600 text-white')
              : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-navy-700'}`}>{t}</button>
        ))}
      </div>
      <FormInput label="Title / description" maxLength={120} error={errors.title?.message} {...register('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput label="Amount" type="number" step="0.01" min="0" inputMode="decimal" error={errors.amount?.message} {...register('amount')} />
        <FormInput label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <FormSelect label="Category" error={errors.category?.message} {...register('category')}>
          {categoriesFor(type).map((c) => <option key={c} value={c}>{c}</option>)}
        </FormSelect>
        <FormSelect label="Payment method" error={errors.paymentMethod?.message} {...register('paymentMethod')}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </FormSelect>
      </div>
      <FormInput label="Tags (optional)" placeholder="work, trip" hint="Separate tags with commas" error={errors.tagsText?.message} {...register('tagsText')} />
      <FormTextarea label="Notes (optional)" maxLength={500} error={errors.notes?.message} {...register('notes')} />
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}</button>
      </div>
    </form>
  );
}
