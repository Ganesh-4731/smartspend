// All money is stored as integer minor units (e.g. paise/cents) to avoid floating point drift.
export const toMinor = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100);
export const fromMinor = (minor) => Math.round(minor || 0) / 100;
export const pct = (part, whole, digits = 1) => {
  if (!whole) return null;
  const f = 10 ** digits;
  return Math.round((part / whole) * 100 * f) / f;
};
export const changePct = (current, previous, digits = 1) => {
  if (!previous) return null; // not meaningful when there is no previous value
  const f = 10 ** digits;
  return Math.round(((current - previous) / previous) * 100 * f) / f;
};
export const formatMoney = (minor, currency = 'INR') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(fromMinor(minor));
