import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import Navbar from '../components/common/Navbar.jsx';
import MobileNav from '../components/common/MobileNav.jsx';

const KEY = 'smartspend-sidebar-collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  const [drawer, setDrawer] = useState(false);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(KEY, c ? '0' : '1'); } catch { /* ignore */ } return !c; });
  const open = useCallback(() => setDrawer(true), []);
  const close = useCallback(() => setDrawer(false), []);
  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar onMenu={open} />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:pb-8"><Outlet /></main>
      </div>
      <MobileNav open={drawer} onOpen={open} onClose={close} />
    </div>
  );
}
