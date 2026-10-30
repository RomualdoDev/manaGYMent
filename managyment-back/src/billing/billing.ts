// Monthly fee due-date rules. Pure functions with no database access,
// so the SMS notification can reuse them.

// Date in the API format: 2026-03-10.
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses YYYY-MM-DD as a local date, avoiding the timezone shift of new Date(string).
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date = new Date(year, month, day);
  const isValid = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  return isValid ? date : null;
}

// Due date within one month: if the month has no chosen day (e.g. 31 in February),
// it is due on the last day of the month. month is 0-based, like JavaScript's Date.
function dueDateIn(billingDay: number, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(billingDay, lastDay));
}

// Next due date starting from `from`. If this month's due date has not passed
// yet (today counts), it is this month; otherwise it is next month.
export function nextDueDate(billingDay: number, from: Date = new Date()): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const thisMonth = dueDateIn(billingDay, from.getFullYear(), from.getMonth());
  if (thisMonth >= today) {
    return thisMonth;
  }
  return dueDateIn(billingDay, from.getFullYear(), from.getMonth() + 1);
}

// billingDay values that are due on the given date.
// Normally just the date's own day. On the last day of the month, days that do
// not exist in that month are included too: on 28/02/2027, billing days 28, 29, 30 and 31 are due.
export function dueBillingDays(date: Date): number[] {
  const day = date.getDate();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (day !== lastDay) {
    return [day];
  }
  const days: number[] = [];
  for (let billingDay = day; billingDay <= 31; billingDay++) {
    days.push(billingDay);
  }
  return days;
}

// Today's date (YYYY-MM-DD) in the given time zone, e.g. the gym's local date.
// Needed because a server running in UTC sees a different calendar day between 21:00 and 23:59 in Brazil.
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
