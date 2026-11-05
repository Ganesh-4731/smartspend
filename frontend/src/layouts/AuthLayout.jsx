import { Link } from 'react-router-dom';
import { PiggyBank, ShieldCheck, TrendingUp } from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h1 className="text-4xl font-bold leading-tight">Know where your money goes.<br /><span className="text-emerald-400">Decide where it grows.</span></h1>
          <ul className="mt-8 space-y-4 text-navy-100">
            <li className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20} />Track income and expenses in seconds</li>
            <li className="flex items-center gap-3"><PiggyBank className="text-emerald-400" size={20} />Budgets and savings goals that keep you on course</li>
            <li className="flex items-center gap-3"><ShieldCheck className="text-emerald-400" size={20} />Your data is private and tied only to your account</li>
          </ul>
        </div>
        <p className="text-xs text-navy-300">© {new Date().getFullYear()} SmartSpend</p>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6"><div className="lg:hidden"><Logo /></div><div className="ml-auto"><ThemeToggle /></div></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-10 sm:px-6">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white">{title}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
          <Link to="/" className="sr-only">Home</Link>
        </div>
      </div>
    </div>
  );
}
