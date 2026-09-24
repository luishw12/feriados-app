import type { Category, Kind, Scope, Status } from '../db/schema';
import { addDays, diffDays, parseRule, resolveRule, weekday } from './rules';

/** Campos mínimos de um feriado necessários para calcular ocorrências. */
export interface HolidayDef {
  id: string;
  name: string;
  scope: Scope;
  kind: Kind;
  rule: string;
  uf: string | null;
  ibge: number | null;
  validFrom: number | null;
  validTo: number | null;
  categories: Category[];
  summary: string;
  status: Status;
}

export interface HolidayOverride {
  holidayId: string;
  year: number;
  date: string | null;
  note: string;
}

export interface Occurrence extends HolidayDef {
  /** YYYY-MM-DD */
  date: string;
  /** 0 = domingo … 6 = sábado */
  weekday: number;
  /** Observação quando a data foi transferida naquele ano. */
  overrideNote: string | null;
  /** Outros feriados do mesmo dia que foram agrupados neste (ex.: Corpus Christi nacional + municipal). */
  merged: string[];
}

const KIND_STRENGTH: Record<Kind, number> = { feriado: 3, facultativo: 2, comemorativa: 1 };
const SCOPE_BREADTH: Record<Scope, number> = { national: 3, state: 2, municipal: 1 };

export function isActiveInYear(def: Pick<HolidayDef, 'validFrom' | 'validTo'>, year: number): boolean {
  if (def.validFrom !== null && year < def.validFrom) return false;
  if (def.validTo !== null && year > def.validTo) return false;
  return true;
}

export function occurrenceDate(def: HolidayDef, year: number, overrides: HolidayOverride[] = []): string | null {
  if (!isActiveInYear(def, year)) return null;
  const override = overrides.find((o) => o.holidayId === def.id && o.year === year);
  if (override) return override.date ? `${year}-${override.date}` : null;
  return resolveRule(def.rule, year);
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\b(dia|de|da|do|das|dos|feriado|municipal|estadual)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Calcula as ocorrências de um conjunto de feriados em um ano, ordenadas por data.
 * Feriados do mesmo dia com o mesmo nome (ex.: "Corpus Christi" nacional facultativo
 * e municipal obrigatório) viram uma única ocorrência — vence o mais forte (feriado >
 * facultativo > comemorativa) e, empatando, o de abrangência mais ampla.
 */
export function resolveYear(defs: HolidayDef[], year: number, overrides: HolidayOverride[] = []): Occurrence[] {
  const occurrences: Occurrence[] = [];
  for (const def of defs) {
    const date = occurrenceDate(def, year, overrides);
    if (!date) continue;
    const override = overrides.find((o) => o.holidayId === def.id && o.year === year);
    occurrences.push({
      ...def,
      date,
      weekday: weekday(date),
      overrideNote: override?.note || null,
      merged: [],
    });
  }

  const byKey = new Map<string, Occurrence>();
  for (const occ of occurrences) {
    const key = `${occ.date}|${normalizeName(occ.name)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, occ);
      continue;
    }
    const winner = compareStrength(occ, existing) > 0 ? occ : existing;
    const loser = winner === occ ? existing : occ;
    winner.merged = [...winner.merged, loser.id, ...loser.merged];
    byKey.set(key, winner);
  }

  return [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date) || compareStrength(b, a));
}

function compareStrength(a: Occurrence, b: Occurrence): number {
  const kind = KIND_STRENGTH[a.kind] - KIND_STRENGTH[b.kind];
  if (kind !== 0) return kind;
  return SCOPE_BREADTH[a.scope] - SCOPE_BREADTH[b.scope];
}

/** Próximas ocorrências a partir de `fromIso` (inclusive), atravessando o ano se preciso. */
export function upcoming(
  defs: HolidayDef[],
  fromIso: string,
  count: number,
  overrides: HolidayOverride[] = [],
  filter: (o: Occurrence) => boolean = () => true,
): Occurrence[] {
  const year = Number(fromIso.slice(0, 4));
  const list = [...resolveYear(defs, year, overrides), ...resolveYear(defs, year + 1, overrides)];
  return list.filter((o) => o.date >= fromIso && filter(o)).slice(0, count);
}

export type BridgeKind = 'emenda-segunda' | 'emenda-sexta' | 'prolongado' | 'meio-de-semana' | 'fim-de-semana';

export interface BridgeInfo {
  kind: BridgeKind;
  /** Primeiro e último dia do descanso possível (inclui fim de semana e a emenda). */
  start: string;
  end: string;
  /** Total de dias seguidos de folga, contando a emenda. */
  days: number;
  /** Dia útil a "emendar" (se houver). */
  bridgeDay: string | null;
}

/**
 * Classifica um feriado em relação ao fim de semana:
 *  - segunda/sexta → feriado prolongado de 3 dias
 *  - terça → emenda na segunda (4 dias)
 *  - quinta → emenda na sexta (4 dias)
 *  - quarta → meio de semana
 *  - sábado/domingo → cai no fim de semana
 */
export function bridgeInfo(date: string): BridgeInfo {
  const dow = weekday(date);
  switch (dow) {
    case 1:
      return { kind: 'prolongado', start: addDays(date, -2), end: date, days: 3, bridgeDay: null };
    case 5:
      return { kind: 'prolongado', start: date, end: addDays(date, 2), days: 3, bridgeDay: null };
    case 2:
      return { kind: 'emenda-segunda', start: addDays(date, -3), end: date, days: 4, bridgeDay: addDays(date, -1) };
    case 4:
      return { kind: 'emenda-sexta', start: date, end: addDays(date, 3), days: 4, bridgeDay: addDays(date, 1) };
    case 3:
      return { kind: 'meio-de-semana', start: date, end: date, days: 1, bridgeDay: null };
    default:
      return { kind: 'fim-de-semana', start: date, end: date, days: 0, bridgeDay: null };
  }
}

/**
 * Conta dias úteis (segunda a sexta, exceto feriados obrigatórios) no intervalo
 * [start, end], inclusivo nas duas pontas.
 */
export function businessDays(
  start: string,
  end: string,
  defs: HolidayDef[],
  overrides: HolidayOverride[] = [],
  options: { includeOptional?: boolean } = {},
): { businessDays: number; totalDays: number; holidaysOnWeekdays: Occurrence[] } {
  const [from, to] = start <= end ? [start, end] : [end, start];
  const fromYear = Number(from.slice(0, 4));
  const toYear = Number(to.slice(0, 4));
  const holidayDates = new Map<string, Occurrence>();
  for (let y = fromYear; y <= toYear; y++) {
    for (const occ of resolveYear(defs, y, overrides)) {
      const counts = occ.kind === 'feriado' || (options.includeOptional === true && occ.kind === 'facultativo');
      if (counts && occ.date >= from && occ.date <= to && !holidayDates.has(occ.date)) holidayDates.set(occ.date, occ);
    }
  }
  const totalDays = diffDays(from, to) + 1;
  let count = 0;
  const holidaysOnWeekdays: Occurrence[] = [];
  let cursor = from;
  for (let i = 0; i < totalDays; i++) {
    const dow = weekday(cursor);
    if (dow !== 0 && dow !== 6) {
      const holiday = holidayDates.get(cursor);
      if (holiday) holidaysOnWeekdays.push(holiday);
      else count++;
    }
    cursor = addDays(cursor, 1);
  }
  return { businessDays: count, totalDays, holidaysOnWeekdays };
}

export function ruleSortKey(rule: string): string {
  const parsed = parseRule(rule);
  if (!parsed) return '99';
  return parsed.type === 'fixed' ? `${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}` : '00';
}
