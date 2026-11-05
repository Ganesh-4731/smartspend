import { describe, it, expect } from 'vitest';
import { toMinor, fromMinor, pct, changePct } from '../src/utils/money.js';
import { parseDay, previousPeriod, monthRange, addMonths, monthsBetween, fmtDay } from '../src/utils/dates.js';
import { csvCell } from '../src/utils/csv.js';

describe('money', () => {
  it('avoids floating point errors', () => {
    expect(toMinor(0.1) + toMinor(0.2)).toBe(30);
    expect(toMinor(1.005)).toBe(101);
    expect(fromMinor(toMinor(19.99))).toBe(19.99);
  });
  it('computes percentages', () => {
    expect(pct(25, 100)).toBe(25);
    expect(pct(1, 0)).toBeNull();
    expect(changePct(118, 100)).toBe(18);
    expect(changePct(5, 0)).toBeNull();
  });
});
describe('dates', () => {
  it('parses only real calendar dates', () => {
    expect(parseDay('2026-02-29')).toBeNull();
    expect(parseDay('2026-13-01')).toBeNull();
    expect(fmtDay(parseDay('2028-02-29'))).toBe('2028-02-29');
  });
  it('handles month boundaries', () => {
    expect(fmtDay(monthRange('2026-02').to)).toBe('2026-02-28');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthsBetween(parseDay('2026-01-15'), parseDay('2026-03-02'))).toEqual(['2026-01', '2026-02', '2026-03']);
  });
  it('computes the previous equal-length period', () => {
    const p = previousPeriod(parseDay('2026-10-01'), parseDay('2026-10-31'));
    expect(fmtDay(p.from)).toBe('2026-08-31'); // 31 days ending 2026-09-30
    expect(fmtDay(p.to)).toBe('2026-09-30');
  });
});
describe('csv', () => {
  it('escapes quotes and neutralises formulas', () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('-12.50')).toBe('-12.50');
  });
});
