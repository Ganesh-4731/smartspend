import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { userApi } from '../api/index.js';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { CURRENCIES, DATE_FORMATS } from '../utils/constants.js';
import { passwordFormSchema, profileFormSchema } from '../utils/schemas.js';
import { FormInput } from '../components/common/Field.jsx';
import Modal from '../components/common/Modal.jsx';
import useFormat from '../hooks/useFormat.js';
import { formatDate } from '../utils/format.js';

function Section({ title, description, children }) {
  return (
    <section className="card">
      <h2 className="font-semibold text-navy-900 dark:text-white">{title}</h2>
      {description && <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {children}
    </section>
  );
}

export default function Profile() {
  const { user, updateUser, setUser, theme, setTheme } = useAuth();
  const { money } = useFormat();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteErr, setDeleteErr] = useState('');
  const [deleting, setDeleting] = useState(false);

  const profile = useForm({ resolver: zodResolver(profileFormSchema), defaultValues: { name: user.name, openingBalance: user.openingBalance } });
  const pw = useForm({ resolver: zodResolver(passwordFormSchema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const saveProfile = async (v) => {
    try { await updateUser({ name: v.name, openingBalance: v.openingBalance }); toast.success('Profile updated'); profile.reset({ name: v.name, openingBalance: v.openingBalance }); }
    catch (e) { getFieldErrors(e).forEach((fe) => profile.setError(fe.field, { message: fe.message })); toast.error(getErrorMessage(e)); }
  };
  const savePref = async (prefs, label) => {
    try { await updateUser({ preferences: prefs }); toast.success(`${label} updated`); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const changePassword = async (v) => {
    try {
      await userApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      toast.success('Password changed. Other devices have been signed out.');
      pw.reset();
    } catch (e) {
      getFieldErrors(e).forEach((fe) => pw.setError(fe.field, { message: fe.message }));
      toast.error(getErrorMessage(e));
    }
  };
  const deleteAccount = async () => {
    setDeleting(true); setDeleteErr('');
    try { await userApi.remove({ password: deletePw }); toast.success('Your account has been deleted'); setUser(null); navigate('/login', { replace: true }); }
    catch (e) { setDeleteErr(getErrorMessage(e)); } finally { setDeleting(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div><h1 className="page-title">Profile & settings</h1><p className="text-sm text-slate-500 dark:text-slate-400">Member since {formatDate(user.createdAt, user.preferences.dateFormat)}</p></div>

      <Section title="Profile" description="Your opening balance is the amount you had before recording any transactions; it is part of your total balance.">
        <form onSubmit={profile.handleSubmit(saveProfile)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <FormInput label="Full name" error={profile.formState.errors.name?.message} {...profile.register('name')} />
          <FormInput label="Email" value={user.email} disabled readOnly hint="Email cannot be changed" />
          <FormInput label="Opening balance" type="number" step="0.01" inputMode="decimal" error={profile.formState.errors.openingBalance?.message} {...profile.register('openingBalance')} hint={`Currently ${money(user.openingBalance)}`} />
          <div className="flex items-end justify-end sm:col-span-2"><button type="submit" className="btn-primary" disabled={profile.formState.isSubmitting || !profile.formState.isDirty}>{profile.formState.isSubmitting ? 'Saving…' : 'Save profile'}</button></div>
        </form>
      </Section>

      <Section title="Preferences" description="Currency only changes how amounts are displayed — your recorded values are never converted.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="pref-currency">Currency</label>
            <select id="pref-currency" className="input" value={user.preferences.currency} onChange={(e) => savePref({ currency: e.target.value }, 'Currency')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
          <div><label className="label" htmlFor="pref-date">Date format</label>
            <select id="pref-date" className="input" value={user.preferences.dateFormat} onChange={(e) => savePref({ dateFormat: e.target.value }, 'Date format')}>
              {DATE_FORMATS.map((f) => <option key={f}>{f}</option>)}</select></div>
          <div><label className="label" htmlFor="pref-theme">Theme</label>
            <select id="pref-theme" className="input" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></div>
        </div>
      </Section>

      <Section title="Change password" description="You'll stay signed in here; all other sessions will be signed out.">
        <form onSubmit={pw.handleSubmit(changePassword)} className="grid gap-4 sm:grid-cols-3" noValidate>
          <FormInput label="Current password" type="password" autoComplete="current-password" error={pw.formState.errors.currentPassword?.message} {...pw.register('currentPassword')} />
          <FormInput label="New password" type="password" autoComplete="new-password" error={pw.formState.errors.newPassword?.message} {...pw.register('newPassword')} />
          <FormInput label="Confirm new password" type="password" autoComplete="new-password" error={pw.formState.errors.confirm?.message} {...pw.register('confirm')} />
          <div className="flex justify-end sm:col-span-3"><button type="submit" className="btn-primary" disabled={pw.formState.isSubmitting}>{pw.formState.isSubmitting ? 'Updating…' : 'Update password'}</button></div>
        </form>
      </Section>

      <section className="card border-coral-200 dark:border-coral-500/30">
        <h2 className="font-semibold text-coral-700 dark:text-coral-400">Danger zone</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">Deleting your account permanently removes your profile, transactions, budgets and goals. This cannot be undone.</p>
        <button type="button" className="btn-danger" onClick={() => { setDeleteOpen(true); setDeletePw(''); setDeleteErr(''); }}>Delete my account</button>
      </section>

      <Modal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Delete your account?" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">Enter your password to confirm. All of your data will be permanently deleted.</p>
        <div className="mt-4">
          <label htmlFor="delete-pw" className="label">Password</label>
          <input id="delete-pw" type="password" className="input" autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} aria-invalid={!!deleteErr} />
          {deleteErr && <p role="alert" className="mt-1 text-xs text-coral-600">{deleteErr}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
          <button type="button" className="btn-danger" onClick={deleteAccount} disabled={deleting || !deletePw}>{deleting ? 'Deleting…' : 'Delete permanently'}</button>
        </div>
      </Modal>
    </div>
  );
}
