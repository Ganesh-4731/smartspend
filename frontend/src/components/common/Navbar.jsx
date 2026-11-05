import { Link } from 'react-router-dom';
import { LogOut, Menu, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-navy-800 dark:bg-navy-950/90">
      <div className="flex items-center gap-2">
        <button type="button" className="btn-icon -ml-2 lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={22} /></button>
        <div className="lg:hidden"><Logo /></div>
        <p className="hidden text-sm text-slate-500 lg:block dark:text-slate-400">Welcome back, <span className="font-semibold text-navy-900 dark:text-white">{user?.name?.split(' ')[0]}</span></p>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/transactions?new=1" className="btn-primary hidden sm:inline-flex"><Plus size={16} aria-hidden="true" />Add transaction</Link>
        <ThemeToggle />
        <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-navy-800 text-xs font-semibold text-white dark:bg-emerald-600" aria-label="Profile" title={user?.name}>{initials}</Link>
        <button type="button" className="btn-icon" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={20} /></button>
      </div>
    </header>
  );
}
