import { describe, expect, it } from 'vitest';
import { addDays, formatIsraeliDate, parseDateOnly, todayString } from '../src/utils/dates';

describe('תאריכים', () => {
  it('"היום" מחושב לפי שעון ישראל', () => {
    // 22:30 UTC = כבר יום למחרת בישראל
    expect(todayString(new Date('2026-10-19T22:30:00Z'))).toBe('2026-10-20');
    expect(todayString(new Date('2026-10-19T20:00:00Z'))).toBe('2026-10-19');
  });

  it('חישוב ימים ופורמט ישראלי', () => {
    expect(formatIsraeliDate(addDays(parseDateOnly('2026-12-30'), 3))).toBe('02.01.2027');
  });
});
