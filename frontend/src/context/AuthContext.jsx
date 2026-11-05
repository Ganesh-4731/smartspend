import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi, userApi } from '../api/index.js';

const AuthContext = createContext(null);
const THEME_KEY = 'smartspend-theme';

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
}
const storedTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState(storedTheme);

  // Restore the session on page load (httpOnly cookie is sent automatically).
  useEffect(() => {
    let cancelled = false;
    authApi.me()
      .then((res) => { if (!cancelled) setUser(res.data.user); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Centralised handling of expired sessions.
  useEffect(() => {
    const onUnauthorized = () => setUser((u) => { if (u) toast.error('Your session has expired. Please log in again.'); return null; });
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  // The user's saved theme wins once logged in; otherwise use the locally stored one.
  useEffect(() => {
    if (user?.preferences?.theme) setThemeState(user.preferences.theme);
  }, [user?.preferences?.theme]);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const login = useCallback(async (body) => { const res = await authApi.login(body); setUser(res.data.user); return res.data.user; }, []);
  const register = useCallback(async (body) => { const res = await authApi.register(body); setUser(res.data.user); return res.data.user; }, []);
  const logout = useCallback(async () => { try { await authApi.logout(); } finally { setUser(null); } }, []);
  const updateUser = useCallback(async (body) => { const res = await userApi.update(body); setUser(res.data.user); return res.data.user; }, []);

  const setTheme = useCallback(async (next) => {
    setThemeState(next);
    if (user) { try { await updateUser({ preferences: { theme: next } }); } catch { toast.error('Could not save theme preference'); } }
  }, [user, updateUser]);
  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  const value = useMemo(() => ({ user, loading, login, register, logout, updateUser, setUser, theme, setTheme, toggleTheme }),
    [user, loading, login, register, logout, updateUser, theme, setTheme, toggleTheme]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
