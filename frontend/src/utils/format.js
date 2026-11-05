export const localeFor = (currency) => (currency === 'INR' ? 'en-IN' : 'en-US');

export function formatMoney(n, currency = 'INR', { compact = false } = {}) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const opts = compact
    ? { notation: 'compact', maximumFractionDigits: 1 }
    : { minimumFractionDigits: currency === 'JPY' ? 0 : 2, maximumFractionDigits: currency === 'JPY' ? 0 : 2 };
  return new Intl.NumberFormat(localeFor(currency), { style: 'currency', currency, ...opts }).format(Number(n));
}

// Dates from the API are calendar dates (UTC midnight). Format by string so there is never a timezone shift.
export const dayOf = (v) => String(v).slice(0, 10);
export function formatDate(v, fmt = 'DD/MM/YYYY') {
  if (!v) return '—';
  const [y, m, d] = dayOf(v).split('-');
  if (!y || !m || !d) return '—';
  if (fmt === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
  if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
  return `${d}/${m}/${y}`;
}
export function monthLabel(key) {
  const [y, m] = String(key).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}
export function dayLabel(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
export const fmtPct = (v, digits = 1) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(digits).replace(/\.0+$/, '')}%`);
