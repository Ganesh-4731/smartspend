import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney, formatDate } from '../utils/format.js';

// Currency and date format come from the user's settings. Changing currency only changes display — values are never converted.
export default function useFormat() {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || 'INR';
  const dateFormat = user?.preferences?.dateFormat || 'DD/MM/YYYY';
  const money = useCallback((n) => formatMoney(n, currency), [currency]);
  const moneyCompact = useCallback((n) => formatMoney(n, currency, { compact: true }), [currency]);
  const date = useCallback((d) => formatDate(d, dateFormat), [dateFormat]);
  return useMemo(() => ({ currency, dateFormat, money, moneyCompact, date }), [currency, dateFormat, money, moneyCompact, date]);
}
