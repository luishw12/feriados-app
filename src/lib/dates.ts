import type { Holiday } from '@/data/schema';

export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  nth: number,
  weekday: number,
): Date {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() === weekday) {
      count++;
      if (count === nth) return date;
    }
  }

  throw new Error(
    `No ${nth}º weekday ${weekday} in month ${month} of year ${year}`,
  );
}

export function resolveDateRule(rule: string, year: number): Date {
  const nthMatch = rule.match(/^nth:(\d{2})-(\d)-(\d)$/);
  if (nthMatch) {
    const month = Number.parseInt(nthMatch[1] ?? '', 10);
    const nth = Number.parseInt(nthMatch[2] ?? '', 10);
    const weekday = Number.parseInt(nthMatch[3] ?? '', 10);
    return getNthWeekdayOfMonth(year, month, nth, weekday);
  }

  const match = rule.match(/^easter([+-]\d+)$/);
  if (!match) {
    throw new Error(`Invalid date rule: ${rule}`);
  }
  const offset = Number.parseInt(match[1] ?? '0', 10);
  const easter = getEasterDate(year);
  const result = new Date(easter);
  result.setDate(result.getDate() + offset);
  return result;
}

export function resolveHolidayDate(holiday: Holiday, year: number): Date {
  if (holiday.date) {
    const parts = holiday.date.split('-');
    const month = Number.parseInt(parts[0] ?? '', 10);
    const day = Number.parseInt(parts[1] ?? '', 10);
    return new Date(year, month - 1, day);
  }
  if (holiday.dateRule) {
    return resolveDateRule(holiday.dateRule, year);
  }
  throw new Error(`Holiday ${holiday.id} has no date or dateRule`);
}

export function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}
