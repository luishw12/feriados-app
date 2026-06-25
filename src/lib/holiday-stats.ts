import type { HolidayType, ResolvedHoliday, SerializedResolvedHoliday } from '@/data/schema';
import { deserializeHolidays } from '@/lib/holidays';

export interface YearHolidayStats {
  mandatory: { total: number; weekday: number; weekend: number; bridge: number };
  optional: { total: number };
}

export function isMandatoryType(type: HolidayType): boolean {
  return type === 'national' || type === 'state' || type === 'municipal';
}

export function isOptionalType(type: HolidayType): boolean {
  return type === 'optional' || type === 'state_optional';
}

export function isRegionalMuted(type: HolidayType, hasLocation: boolean): boolean {
  if (hasLocation) return false;
  return type !== 'national' && type !== 'optional' && type !== 'commemorative';
}

export function getHolidayDedupeKey(holiday: ResolvedHoliday, hasLocation: boolean): string {
  const muted = isRegionalMuted(holiday.type, hasLocation);
  return muted
    ? `regional-${holiday.resolvedDate.toISOString().slice(0, 10)}`
    : `${holiday.id}-${holiday.resolvedDate.toISOString()}`;
}

export function dedupeCalendarHolidays(
  holidays: ResolvedHoliday[],
  hasLocation: boolean,
): ResolvedHoliday[] {
  const seen = new Set<string>();
  return holidays
    .sort((a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime())
    .filter((holiday) => {
      const key = getHolidayDedupeKey(holiday, hasLocation);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

export function isBridgeCandidate(date: Date): boolean {
  const day = date.getDay();
  return day === 2 || day === 4;
}

function isWeekdayInternal(date: Date): boolean {
  return isWeekday(date);
}

function isBridgeCandidateInternal(date: Date): boolean {
  return isBridgeCandidate(date);
}

export function computeYearHolidayStats(
  nationalHolidays: SerializedResolvedHoliday[],
  regionalHolidays: SerializedResolvedHoliday[],
  contextHolidays: SerializedResolvedHoliday[],
  hasLocation: boolean,
  year: number,
): YearHolidayStats {
  const all = deserializeHolidays([
    ...nationalHolidays,
    ...(hasLocation ? contextHolidays : regionalHolidays),
  ]).filter((holiday) => holiday.resolvedDate.getFullYear() === year);

  const deduped = dedupeCalendarHolidays(all, hasLocation);
  const mandatory = deduped.filter((holiday) => isMandatoryType(holiday.type));
  const optional = deduped.filter((holiday) => isOptionalType(holiday.type));

  return {
    mandatory: {
      total: mandatory.length,
      weekday: mandatory.filter((holiday) => isWeekdayInternal(holiday.resolvedDate)).length,
      weekend: mandatory.filter((holiday) => !isWeekdayInternal(holiday.resolvedDate)).length,
      bridge: mandatory.filter((holiday) => isBridgeCandidateInternal(holiday.resolvedDate)).length,
    },
    optional: {
      total: optional.length,
    },
  };
}
