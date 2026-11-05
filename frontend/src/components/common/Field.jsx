import { forwardRef, useId } from 'react';

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      {label && <label className="label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-coral-600 dark:text-coral-400">{error}</p>}
    </div>
  );
}

// Convenience wrappers that wire label/error/aria together: <FormInput label="Title" error={errors.title?.message} {...register('title')} />
export const FormInput = forwardRef(function FormInput({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return <Field label={label} error={error} hint={hint} htmlFor={id}><input id={id} ref={ref} className={`input ${className}`} aria-invalid={!!error} {...props} /></Field>;
});
export const FormSelect = forwardRef(function FormSelect({ label, error, hint, children, className = '', ...props }, ref) {
  const id = useId();
  return <Field label={label} error={error} hint={hint} htmlFor={id}><select id={id} ref={ref} className={`input ${className}`} aria-invalid={!!error} {...props}>{children}</select></Field>;
});
export const FormTextarea = forwardRef(function FormTextarea({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return <Field label={label} error={error} hint={hint} htmlFor={id}><textarea id={id} ref={ref} rows={3} className={`input ${className}`} aria-invalid={!!error} {...props} /></Field>;
});
