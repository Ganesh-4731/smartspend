import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate } from './format.js';
import { rangeForPreset, toDay } from './dates.js';
import { buildCsv } from './csv.js';
import { transactionFormSchema } from './schemas.js';

describe('format', () => {
  it('formats INR and dates without timezone shifts', () => {
    expect(formatMoney(1234.5, 'INR')).toContain('1,234.50');
    expect(formatMoney(null)).toBe('—');
    expect(formatDate('2026-10-05T00:00:00.000Z', 'DD/MM/YYYY')).toBe('05/10/2026');
    expect(formatDate('2026-10-05', 'MM/DD/YYYY')).toBe('10/05/2026');
  });
});
describe('date presets', () => {
  const now = new Date(2026, 9, 29); // 29 Oct 2026 (local)
  it('resolves ranges', () => {
    expect(rangeForPreset('thisMonth', now)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(rangeForPreset('lastMonth', now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(rangeForPreset('last3', now)).toEqual({ from: '2026-08-01', to: '2026-10-31' });
    expect(rangeForPreset('last6', now)).toEqual({ from: '2026-05-01', to: '2026-10-31' });
    expect(rangeForPreset('thisYear', now)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(toDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
describe('csv', () => {
  it('escapes and neutralises formulas', () => {
    expect(buildCsv([{ header: 'A', value: 'a' }], [{ a: '=1+1' }, { a: 'x,y' }])).toContain("'=1+1");
  });
});
describe('transaction form schema', () => {
  const base = { title: 'Lunch', amount: '12.5', type: 'expense', category: 'Food', date: '2026-10-05', paymentMethod: 'UPI' };
  it('accepts valid input and coerces the amount', () => {
    const r = transactionFormSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data.amount).toBe(12.5);
  });
  it('rejects bad amounts and mismatched categories', () => {
    expect(transactionFormSchema.safeParse({ ...base, amount: '-3' }).success).toBe(false);
    expect(transactionFormSchema.safeParse({ ...base, amount: '1.234' }).success).toBe(false);
    expect(transactionFormSchema.safeParse({ ...base, category: 'Salary' }).success).toBe(false);
  });
});
