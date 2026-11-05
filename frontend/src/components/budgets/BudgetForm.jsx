import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { FormInput, FormSelect } from '../common/Field.jsx';
import { budgetFormSchema } from '../../utils/schemas.js';
import { EXPENSE_CATEGORIES } from '../../utils/constants.js';
import { getErrorMessage, getFieldErrors } from '../../api/client.js';

export default function BudgetForm({ budget, month, onSubmit, onCancel }) {
  const [formError, setFormError] = useState('');
  const { register, control, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { overallLimit: budget?.overallLimit ?? '', categoryLimits: budget?.categoryLimits?.map((c) => ({ category: c.category, limit: c.limit })) || [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'categoryLimits' });
  const used = watch('categoryLimits')?.map((c) => c.category) || [];
  const nextCategory = EXPENSE_CATEGORIES.find((c) => !used.includes(c));

  const submit = async (v) => {
    setFormError('');
    try {
      await onSubmit({ month, overallLimit: v.overallLimit === '' || v.overallLimit === undefined ? null : v.overallLimit,
        categoryLimits: v.categoryLimits.map((c) => ({ category: c.category, limit: c.limit })) });
    } catch (e) {
      getFieldErrors(e).forEach((fe) => setError(fe.field, { message: fe.message }));
      setFormError(getErrorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      {formError && <div role="alert" className="rounded-xl bg-coral-50 px-3 py-2 text-sm text-coral-700 dark:bg-coral-500/10 dark:text-coral-400">{formError}</div>}
      <FormInput label="Overall monthly expense limit" type="number" step="0.01" min="0" inputMode="decimal" hint="Compared with ALL expenses in the month"
        error={errors.overallLimit?.message} {...register('overallLimit')} />
      <fieldset>
        <legend className="label">Category limits (optional)</legend>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
              <FormSelect aria-label="Category" error={errors.categoryLimits?.[i]?.category?.message} {...register(`categoryLimits.${i}.category`)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} disabled={used.includes(c) && used[i] !== c}>{c}</option>)}
              </FormSelect>
              <FormInput aria-label="Limit" placeholder="Limit" type="number" step="0.01" min="0" inputMode="decimal" error={errors.categoryLimits?.[i]?.limit?.message} {...register(`categoryLimits.${i}.limit`)} />
              <button type="button" className="btn-icon mt-0.5 hover:text-coral-600" onClick={() => remove(i)} aria-label="Remove category limit"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        {errors.categoryLimits?.message && <p role="alert" className="mt-1 text-xs text-coral-600">{errors.categoryLimits.message}</p>}
        <button type="button" className="btn-secondary mt-3" disabled={!nextCategory} onClick={() => append({ category: nextCategory, limit: '' })}><Plus size={16} />Add category limit</button>
      </fieldset>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : budget ? 'Save budget' : 'Create budget'}</button>
      </div>
    </form>
  );
}
