/**
 * Motor de regras de data.
 *
 * DSL (campo `rule` de cada feriado):
 *   fixed:MM-DD        data fixa                      fixed:12-25
 *   easter:+N | -N     dias a partir do Domingo de Páscoa  easter:-47 (Carnaval)
 *   nth:MM:DOW:N       N-ésimo dia da semana do mês   nth:05:0:2 (2º domingo de maio)
 *   last:MM:DOW        último dia da semana do mês    last:10:5
 *
 * DOW: 0 = domingo … 6 = sábado. Todas as datas são "de calendário" (ISO YYYY-MM-DD),
 * calculadas em UTC para não sofrer com fuso/horário de verão.
 */

export type ParsedRule =
  | { type: 'fixed'; month: number; day: number }
  | { type: 'easter'; offset: number }
  | { type: 'nth'; month: number; weekday: number; n: number }
  | { type: 'last'; month: number; weekday: number };

const DAY_MS = 86_400_000;

export function parseRule(rule: string): ParsedRule | null {
  const trimmed = rule.trim();
  let m = /^fixed:(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(2024, month)) return null;
    return { type: 'fixed', month, day };
  }
  m = /^easter:([+-]\d{1,3})$/.exec(trimmed);
  if (m) return { type: 'easter', offset: Number(m[1]) };
  m = /^nth:(\d{2}):([0-6]):([1-5])$/.exec(trimmed);
  if (m) {
    const month = Number(m[1]);
    if (month < 1 || month > 12) return null;
    return { type: 'nth', month, weekday: Number(m[2]), n: Number(m[3]) };
  }
  m = /^last:(\d{2}):([0-6])$/.exec(trimmed);
  if (m) {
    const month = Number(m[1]);
    if (month < 1 || month > 12) return null;
    return { type: 'last', month, weekday: Number(m[2]) };
  }
  return null;
}

export function isValidRule(rule: string): boolean {
  return parseRule(rule) !== null;
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function easterSunday(year: number): string {
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
  return toIso(year, month, day);
}

export function resolveRule(rule: string | ParsedRule, year: number): string | null {
  const parsed = typeof rule === 'string' ? parseRule(rule) : rule;
  if (!parsed) return null;
  switch (parsed.type) {
    case 'fixed':
      if (parsed.day > daysInMonth(year, parsed.month)) return null;
      return toIso(year, parsed.month, parsed.day);
    case 'easter':
      return addDays(easterSunday(year), parsed.offset);
    case 'nth': {
      const firstDow = weekday(toIso(year, parsed.month, 1));
      const day = 1 + ((parsed.weekday - firstDow + 7) % 7) + (parsed.n - 1) * 7;
      if (day > daysInMonth(year, parsed.month)) return null;
      return toIso(year, parsed.month, day);
    }
    case 'last': {
      const lastDay = daysInMonth(year, parsed.month);
      const lastDow = weekday(toIso(year, parsed.month, lastDay));
      return toIso(year, parsed.month, lastDay - ((lastDow - parsed.weekday + 7) % 7));
    }
  }
}

const WEEKDAY_NAMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Descrição da regra em português ("25 de dezembro", "47 dias antes da Páscoa"). */
export function describeRule(rule: string): string {
  const parsed = parseRule(rule);
  if (!parsed) return 'regra inválida';
  switch (parsed.type) {
    case 'fixed':
      return `${parsed.day} de ${MONTH_NAMES[parsed.month - 1]}`;
    case 'easter':
      if (parsed.offset === 0) return 'Domingo de Páscoa';
      return parsed.offset < 0
        ? `${-parsed.offset} dias antes da Páscoa`
        : `${parsed.offset} dias depois da Páscoa`;
    case 'nth':
      return `${parsed.n}º ${WEEKDAY_NAMES[parsed.weekday]} de ${MONTH_NAMES[parsed.month - 1]}`;
    case 'last':
      return `último(a) ${WEEKDAY_NAMES[parsed.weekday]} de ${MONTH_NAMES[parsed.month - 1]}`;
  }
}

export function isMovable(rule: string): boolean {
  const parsed = parseRule(rule);
  return parsed !== null && parsed.type !== 'fixed';
}

// ——— utilidades de data ISO ———

export function toIso(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isoToUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function utcToIso(ms: number): string {
  const date = new Date(ms);
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(iso: string, days: number): string {
  return utcToIso(isoToUtc(iso) + days * DAY_MS);
}

export function diffDays(fromIso: string, toIsoDate: string): number {
  return Math.round((isoToUtc(toIsoDate) - isoToUtc(fromIso)) / DAY_MS);
}

/** 0 = domingo … 6 = sábado */
export function weekday(iso: string): number {
  return new Date(isoToUtc(iso)).getUTCDay();
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function weekdayName(iso: string): string {
  return WEEKDAY_NAMES[weekday(iso)] ?? '';
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

/** "25 de dezembro" */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} de ${monthName(m ?? 1)}`;
}

/** "sexta-feira, 25 de dezembro de 2026" */
export function formatLong(iso: string): string {
  return `${weekdayName(iso)}, ${formatDayMonth(iso)} de ${iso.slice(0, 4)}`;
}

/** "25/12/2026" */
export function formatShort(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Data de hoje (ISO) no fuso de Brasília. */
export function todayInBrazil(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts;
}

export function isWeekend(iso: string): boolean {
  const dow = weekday(iso);
  return dow === 0 || dow === 6;
}
