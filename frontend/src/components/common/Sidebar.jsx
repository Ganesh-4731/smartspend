import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '../../utils/nav.js';
import Logo from './Logo.jsx';

export const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'}`;

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex dark:border-navy-800 dark:bg-navy-900 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex h-16 items-center border-b border-slate-200 dark:border-navy-800 ${collapsed ? 'justify-center' : 'px-5'}`}><Logo compact={collapsed} /></div>
      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={(s) => `${linkClass(s)} ${collapsed ? 'justify-center' : ''}`} title={collapsed ? label : undefined} aria-label={label}>
            <Icon size={20} aria-hidden="true" className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-navy-800">
        <button type="button" onClick={onToggle} className={`btn-ghost w-full ${collapsed ? 'px-0' : 'justify-start'}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
