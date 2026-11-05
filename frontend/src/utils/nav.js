import { BarChart3, LayoutDashboard, ArrowLeftRight, Wallet, Sparkles, Target, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/insights', label: 'Smart Insights', icon: Sparkles },
  { to: '/goals', label: 'Savings Goals', icon: Target },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/profile', label: 'Profile & Settings', icon: Settings },
];
export const MOBILE_PRIMARY = ['/dashboard', '/transactions', '/budgets', '/goals'];
