import { dueBillingDays, nextDueDate, parseDateOnly, toDateOnly, todayIn } from './billing';

// Months are 1-based here so the tests read naturally: d(2027, 2, 28) is 28 February 2027.
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day);

describe('nextDueDate', () => {
  it('is due this month when the day has not arrived yet', () => {
    expect(toDateOnly(nextDueDate(10, d(2026, 3, 5)))).toBe('2026-03-10');
  });

  it('is due today when today is the due day', () => {
    expect(toDateOnly(nextDueDate(10, d(2026, 3, 10)))).toBe('2026-03-10');
  });

  it('moves to the next month after the due day has passed', () => {
    expect(toDateOnly(nextDueDate(10, d(2026, 3, 11)))).toBe('2026-04-10');
  });

  it('clamps day 31 to the last day of February', () => {
    expect(toDateOnly(nextDueDate(31, d(2027, 2, 1)))).toBe('2027-02-28');
  });

  it('clamps day 31 to 29 February in a leap year', () => {
    expect(toDateOnly(nextDueDate(31, d(2028, 2, 1)))).toBe('2028-02-29');
  });

  it('clamps day 31 to 30 April', () => {
    expect(toDateOnly(nextDueDate(31, d(2026, 4, 1)))).toBe('2026-04-30');
  });

  it('rolls over the year from December to January', () => {
    expect(toDateOnly(nextDueDate(5, d(2026, 12, 20)))).toBe('2027-01-05');
  });

  it('is due on 31 January on the day itself and on 28 February afterwards', () => {
    expect(toDateOnly(nextDueDate(31, d(2027, 1, 31)))).toBe('2027-01-31');
    expect(toDateOnly(nextDueDate(31, d(2027, 2, 1)))).toBe('2027-02-28');
  });
});

describe('dueBillingDays', () => {
  it('returns only the regular day', () => {
    expect(dueBillingDays(d(2026, 3, 15))).toEqual([15]);
  });

  it('includes the non-existent days on the last day of February', () => {
    expect(dueBillingDays(d(2027, 2, 28))).toEqual([28, 29, 30, 31]);
  });

  it('includes 30 and 31 on the last day of April', () => {
    expect(dueBillingDays(d(2026, 4, 30))).toEqual([30, 31]);
  });

  it('does not include extra days when it is not the last day of the month', () => {
    expect(dueBillingDays(d(2028, 2, 28))).toEqual([28]);
  });
});

describe('parseDateOnly', () => {
  it('reads a valid date as a local date', () => {
    expect(toDateOnly(parseDateOnly('2027-02-28') as Date)).toBe('2027-02-28');
  });

  it('rejects the wrong format and non-existent dates', () => {
    expect(parseDateOnly('abc')).toBeNull();
    expect(parseDateOnly('2027-02-30')).toBeNull();
    expect(parseDateOnly('27/02/2027')).toBeNull();
  });
});

describe('todayIn', () => {
  it('uses the academy calendar day, not the UTC day', () => {
    // 23:30 in Brasília on 10 March 2026 is 02:30 UTC on 11 March.
    const now = new Date('2026-03-11T02:30:00Z');
    expect(todayIn('America/Sao_Paulo', now)).toBe('2026-03-10');
    expect(todayIn('UTC', now)).toBe('2026-03-11');
  });
});
