import type { HolidayType } from '@/data/schema';

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  national: 'Nacional',
  state: 'Estadual',
  municipal: 'Municipal',
  optional: 'Facultativo',
  state_optional: 'Facultativo Estadual',
  commemorative: 'Comemorativa',
};

export const HOLIDAY_TYPE_COLORS: Record<HolidayType, { bg: string; text: string; dot: string }> = {
  national: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-holiday-national',
  },
  state: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-holiday-state',
  },
  municipal: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-holiday-municipal',
  },
  optional: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-holiday-optional',
  },
  state_optional: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-holiday-state_optional',
  },
  commemorative: {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    text: 'text-pink-700 dark:text-pink-300',
    dot: 'bg-holiday-commemorative',
  },
};

export function formatHolidayDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getHolidayBadgeLabel(type: HolidayType): string {
  if (type === 'commemorative') return 'Data comemorativa';
  const isOptional = type === 'optional' || type === 'state_optional';
  if (isOptional) return HOLIDAY_TYPE_LABELS[type];
  return `${HOLIDAY_TYPE_LABELS[type]} · Obrigatório`;
}

const HOLIDAY_SHORT_NAMES: Record<string, string> = {
  'Confraternização Universal': 'Ano Novo',
  'Carnaval (Segunda-feira)': 'Carnaval',
  'Carnaval (Terça-feira)': 'Carnaval',
  'Quarta-feira de Cinzas': 'Cinzas',
  'Sexta-feira Santa': 'Sexta Santa',
  'Dia do Trabalho': 'Trabalho',
  'Corpus Christi': 'Corpus',
  'Independência do Brasil': 'Independ.',
  'Nossa Senhora Aparecida': 'Aparecida',
  'Proclamação da República': 'República',
  'Dia da Consciência Negra': 'Consciência',
  'Feriado regional': 'Regional',
  'Dia Internacional da Mulher': 'Mulher',
  'Dia das Mães': 'Mães',
  'Dia dos Pais': 'Pais',
  'Dia dos Namorados': 'Namorados',
  'Dia das Crianças': 'Crianças',
  'Dia do Professor': 'Professor',
  'Dia do Amigo': 'Amigo',
  'Dia de São João': 'São João',
};

export function abbreviateHolidayName(name: string, maxLength: number): string {
  const mapped = HOLIDAY_SHORT_NAMES[name];
  const cleaned = (mapped ?? name.replace(/\s*\([^)]*\)/g, '').trim()).trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

export function getCalendarHolidayLabel(names: string[], compact: boolean): string {
  if (names.length === 0) return '';
  const maxLength = compact ? 5 : 14;
  const first = abbreviateHolidayName(names[0] ?? '', maxLength);
  if (names.length === 1) return first;
  return compact ? `+${names.length}` : `${abbreviateHolidayName(names[0] ?? '', 10)} +${names.length - 1}`;
}
