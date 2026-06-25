import type { ResolvedHoliday } from '@/data/schema';
import { formatHolidayDate, MONTH_NAMES } from '@/lib/constants';
import {
  getAllNationalCalendarEvents,
  getAllNationalHolidays,
  getNextHoliday,
} from '@/lib/holidays';
import { isBridgeCandidate, isMandatoryType, isOptionalType, isWeekday } from '@/lib/holiday-stats';

export interface NationalYearInsights {
  year: number;
  mandatory: ResolvedHoliday[];
  optional: ResolvedHoliday[];
  commemorative: ResolvedHoliday[];
  mandatoryWeekday: ResolvedHoliday[];
  mandatoryWeekend: ResolvedHoliday[];
  bridgeCandidates: ResolvedHoliday[];
  mobileHolidays: {
    carnavalSegunda: ResolvedHoliday | null;
    carnavalTerca: ResolvedHoliday | null;
    sextaSanta: ResolvedHoliday | null;
    pascoa: ResolvedHoliday | null;
    corpusChristi: ResolvedHoliday | null;
  };
  nextHoliday: ResolvedHoliday | null;
  byMonth: Array<{ month: number; monthName: string; holidays: ResolvedHoliday[] }>;
  stats: {
    mandatoryTotal: number;
    mandatoryWeekdayCount: number;
    mandatoryWeekendCount: number;
    bridgeCount: number;
    optionalTotal: number;
    commemorativeTotal: number;
    calendarTotal: number;
  };
}

function findById(holidays: ResolvedHoliday[], id: string): ResolvedHoliday | null {
  return holidays.find((holiday) => holiday.id === id) ?? null;
}

export function buildNationalYearInsights(year: number): NationalYearInsights {
  const all = getAllNationalCalendarEvents(year);
  const mandatory = all.filter((holiday) => holiday.type === 'national');
  const optional = all.filter((holiday) => isOptionalType(holiday.type));
  const commemorative = all.filter((holiday) => holiday.type === 'commemorative');
  const mandatoryWeekday = mandatory.filter((holiday) => isWeekday(holiday.resolvedDate));
  const mandatoryWeekend = mandatory.filter((holiday) => !isWeekday(holiday.resolvedDate));
  const bridgeCandidates = mandatory.filter((holiday) => isBridgeCandidate(holiday.resolvedDate));

  const byMonth = MONTH_NAMES.map((monthName, month) => ({
    month,
    monthName,
    holidays: all.filter((holiday) => holiday.resolvedDate.getMonth() === month),
  })).filter((entry) => entry.holidays.length > 0);

  return {
    year,
    mandatory,
    optional,
    commemorative,
    mandatoryWeekday,
    mandatoryWeekend,
    bridgeCandidates,
    mobileHolidays: {
      carnavalSegunda: findById(all, 'carnaval-segunda'),
      carnavalTerca: findById(all, 'carnaval-terca'),
      sextaSanta: findById(all, 'sexta-santa'),
      pascoa: findById(all, 'pascoa'),
      corpusChristi: findById(all, 'corpus-christi'),
    },
    nextHoliday: getNextHoliday(getAllNationalHolidays(year)),
    byMonth,
    stats: {
      mandatoryTotal: mandatory.length,
      mandatoryWeekdayCount: mandatoryWeekday.length,
      mandatoryWeekendCount: mandatoryWeekend.length,
      bridgeCount: bridgeCandidates.length,
      optionalTotal: optional.length,
      commemorativeTotal: commemorative.length,
      calendarTotal: all.length,
    },
  };
}

export function formatHolidayLine(holiday: ResolvedHoliday): string {
  const date = formatHolidayDate(holiday.resolvedDate);
  const iso = holiday.resolvedDate.toISOString().split('T')[0];
  return `${holiday.name}: ${date} (${iso})`;
}

export function formatHolidayList(holidays: ResolvedHoliday[]): string {
  return holidays.map(formatHolidayLine).join('; ');
}

export function describeBridgeHoliday(holiday: ResolvedHoliday): string {
  const day = holiday.resolvedDate.getDay();
  if (day === 2) {
    return `${holiday.name} cai em terça-feira — possível emenda com segunda-feira para feriado prolongado`;
  }
  if (day === 4) {
    return `${holiday.name} cai em quinta-feira — possível emenda com sexta-feira para feriado prolongado`;
  }
  return formatHolidayLine(holiday);
}

export function isNationalMandatory(holiday: ResolvedHoliday): boolean {
  return holiday.type === 'national';
}

export function filterMandatoryForStats(holidays: ResolvedHoliday[]): ResolvedHoliday[] {
  return holidays.filter((holiday) => isMandatoryType(holiday.type));
}
