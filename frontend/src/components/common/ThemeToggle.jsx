import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAuth();
  const dark = theme === 'dark';
  return (
    <button type="button" className="btn-icon" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'}>
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
