// Transaction dates are calendar dates, stored as UTC midnight. All ranges are inclusive calendar dates in UTC,
// so there is no timezone drift at month boundaries. The client sends YYYY-MM-DD strings.
export const DAY_MS = 86400000;

export function parseDay(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}
export const fmtDay = (d) => d.toISOString().slice(0, 10);
export const monthKey = (d) => d.toISOString().slice(0, 7);
export const isMonthKey = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export function monthRange(key) {
  const [y, m] = key.split('-').map(Number);
  return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 0)) };
}
export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return monthKey(d);
}
export function todayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
export const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
export const daysBetween = (from, to) => Math.round((to - from) / DAY_MS) + 1;

// Previous period of equal length ending the day before `from`.
export function previousPeriod(from, to) {
  const len = daysBetween(from, to);
  const prevTo = addDays(from, -1);
  return { from: addDays(prevTo, -(len - 1)), to: prevTo };
}

// All month keys between two dates (inclusive).
export function monthsBetween(from, to) {
  const out = [];
  let k = monthKey(from);
  const end = monthKey(to);
  while (k <= end && out.length < 600) { out.push(k); k = addMonths(k, 1); }
  return out;
}
export function daysList(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(fmtDay(d));
  return out;
}

// Resolve {from,to} from validated query strings; defaults to the current month.
export function resolveRange(query = {}) {
  const today = todayUTC();
  const def = monthRange(monthKey(today));
  const from = query.from ? parseDay(query.from) : def.from;
  const to = query.to ? parseDay(query.to) : def.to;
  return { from, to };
}
