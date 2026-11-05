import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { NAV_ITEMS, MOBILE_PRIMARY } from '../../utils/nav.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { linkClass } from './Sidebar.jsx';
import Logo from './Logo.jsx';

export default function MobileNav({ open, onOpen, onClose }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.to));
  return (
    <>
      <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-navy-800 dark:bg-navy-900">
        {primary.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <Icon size={20} aria-hidden="true" /><span className="max-w-full truncate px-1">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
        <button type="button" onClick={onOpen} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400" aria-label="More menu">
          <Menu size={20} aria-hidden="true" /><span>More</span>
        </button>
      </nav>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={onClose} aria-hidden="true" />
          <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-navy-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-navy-800">
              <Logo />
              <button type="button" className="btn-icon" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
            </div>
            <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass}><Icon size={20} aria-hidden="true" />{label}</NavLink>
              ))}
            </nav>
            <div className="border-t border-slate-200 p-3 dark:border-navy-800">
              <button type="button" className="btn-ghost w-full justify-start" onClick={logout}><LogOut size={18} />Log out</button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
