/**
 * Ida e volta entre a regra em texto (DSL de `rules.ts`) e os campos dos
 * formulários (calendário, lista de datas da Páscoa, "2º domingo de maio"…).
 * Usado no navegador: não importe nada do servidor aqui.
 */
import { parseRule, resolveRule } from './rules';

export type RuleMode = 'fixed' | 'easter' | 'nth' | 'last' | 'raw';

export interface RuleParts {
  mode: RuleMode;
  /** 1–12 (fixed, nth, last) */
  month: number;
  /** 1–31 (fixed) */
  day: number;
  /** dias a partir do Domingo de Páscoa (easter) */
  offset: number;
  /** 0 = domingo … 6 = sábado (nth, last) */
  weekday: number;
  /** 1–5 (nth) */
  n: number;
  /** texto livre do modo avançado */
  raw: string;
}

export const EASTER_PRESETS: readonly { offset: number; label: string }[] = [
  { offset: -48, label: 'Segunda-feira de Carnaval' },
  { offset: -47, label: 'Terça-feira de Carnaval' },
  { offset: -46, label: 'Quarta-feira de Cinzas' },
  { offset: -3, label: 'Quinta-feira Santa' },
  { offset: -2, label: 'Sexta-feira Santa' },
  { offset: 0, label: 'Domingo de Páscoa' },
  { offset: 60, label: 'Corpus Christi' },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function ruleToParts(rule: string): RuleParts {
  const base: RuleParts = { mode: 'fixed', month: 1, day: 1, offset: -47, weekday: 0, n: 1, raw: rule };
  const parsed = parseRule(rule);
  if (!parsed) return rule.trim() ? { ...base, mode: 'raw' } : base;
  switch (parsed.type) {
    case 'fixed':
      return { ...base, mode: 'fixed', month: parsed.month, day: parsed.day };
    case 'easter':
      return { ...base, mode: 'easter', offset: parsed.offset };
    case 'nth':
      return { ...base, mode: 'nth', month: parsed.month, weekday: parsed.weekday, n: parsed.n };
    case 'last':
      return { ...base, mode: 'last', month: parsed.month, weekday: parsed.weekday };
  }
}

export function partsToRule(parts: RuleParts): string {
  switch (parts.mode) {
    case 'fixed':
      return `fixed:${pad(parts.month)}-${pad(parts.day)}`;
    case 'easter':
      return `easter:${parts.offset >= 0 ? '+' : ''}${parts.offset}`;
    case 'nth':
      return `nth:${pad(parts.month)}:${parts.weekday}:${parts.n}`;
    case 'last':
      return `last:${pad(parts.month)}:${parts.weekday}`;
    case 'raw':
      return parts.raw.trim();
  }
}

/** Próximas ocorrências a partir de um ano (pula anos sem a data, como 29/02). */
export function nextOccurrences(rule: string, fromYear: number, count = 3): string[] {
  const dates: string[] = [];
  for (let year = fromYear; dates.length < count && year < fromYear + count * 8; year++) {
    const date = resolveRule(rule, year);
    if (date) dates.push(date);
  }
  return dates;
}

/** "MM-DD" → partes numéricas, ou null se inválido (aceita 29/02). */
export function parseMonthDay(value: string): { month: number; day: number } | null {
  const parsed = parseRule(`fixed:${value}`);
  return parsed && parsed.type === 'fixed' ? { month: parsed.month, day: parsed.day } : null;
}
