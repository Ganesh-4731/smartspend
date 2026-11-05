import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { FormInput } from '../components/common/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import { loginFormSchema } from '../utils/schemas.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginFormSchema), defaultValues: { email: '', password: '' } });
  const onSubmit = async (values) => {
    setFormError('');
    try {
      await login(values);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (e) { setFormError(getErrorMessage(e)); }
  };
  return (
    <AuthLayout title="Log in" subtitle="Welcome back — enter your details to continue." footer={<>New to SmartSpend? <Link className="font-medium text-emerald-600 hover:underline" to="/register">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-xl bg-coral-50 px-3 py-2 text-sm text-coral-700 dark:bg-coral-500/10 dark:text-coral-400">{formError}</div>}
        <FormInput label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
        <FormInput label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthLayout>
  );
}
