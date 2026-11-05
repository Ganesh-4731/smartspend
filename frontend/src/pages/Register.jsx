import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { FormInput } from '../components/common/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { registerFormSchema } from '../utils/schemas.js';

export default function Register() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerFormSchema), defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const onSubmit = async ({ confirm: _c, ...values }) => {
    setFormError('');
    try {
      await signUp(values);
      toast.success('Account created. Let\'s add your first transaction!');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      getFieldErrors(e).forEach((fe) => setError(fe.field, { message: fe.message }));
      setFormError(getErrorMessage(e));
    }
  };
  return (
    <AuthLayout title="Create your account" subtitle="Start tracking your money in under a minute." footer={<>Already have an account? <Link className="font-medium text-emerald-600 hover:underline" to="/login">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-xl bg-coral-50 px-3 py-2 text-sm text-coral-700 dark:bg-coral-500/10 dark:text-coral-400">{formError}</div>}
        <FormInput label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <FormInput label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
        <FormInput label="Password" type="password" autoComplete="new-password" hint="At least 8 characters with a letter and a number" error={errors.password?.message} {...register('password')} />
        <FormInput label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  );
}
