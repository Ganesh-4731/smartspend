// Presets resolve to local calendar dates (YYYY-MM-DD) sent to the API as inclusive ranges.
const pad = (n) => String(n).padStart(2, '0');
export const toDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDay(new Date());
export const currentMonthKey = () => todayStr().slice(0, 7);

export const PRESETS = [
  { value: 'thisMonth', label: 'Current month' },
  { value: 'lastMonth', label: 'Previous month' },
  { value: 'last3', label: 'Last 3 months' },
  { value: 'last6', label: 'Last 6 months' },
  { value: 'thisYear', label: 'Current year' },
  { value: 'custom', label: 'Custom range' },
];

// "Last N months" = the current calendar month plus the N-1 months before it.
export function rangeForPreset(preset, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = (yy, mm) => new Date(yy, mm, 1);
  const last = (yy, mm) => new Date(yy, mm + 1, 0);
  switch (preset) {
    case 'lastMonth': return { from: toDay(first(y, m - 1)), to: toDay(last(y, m - 1)) };
    case 'last3': return { from: toDay(first(y, m - 2)), to: toDay(last(y, m)) };
    case 'last6': return { from: toDay(first(y, m - 5)), to: toDay(last(y, m)) };
    case 'thisYear': return { from: toDay(new Date(y, 0, 1)), to: toDay(new Date(y, 11, 31)) };
    case 'thisMonth':
    default: return { from: toDay(first(y, m)), to: toDay(last(y, m)) };
  }
}
