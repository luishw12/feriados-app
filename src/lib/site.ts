import type { Kind, Scope, Status } from './db/schema';
import { todayInBrazil } from './holidays/rules';

export const SITE_NAME = 'Feriados Brasil';
export const SITE_TAGLINE = 'Todos os feriados nacionais, estaduais e municipais do Brasil';
export const AUTHOR = {
  name: 'Luís Henrique Wendt',
  jobTitle: 'Desenvolvedor de software',
  /** Portfólio e currículo do autor. */
  website: 'https://luishw.com.br',
  linkedin: 'https://www.linkedin.com/in/luishw',
  github: 'https://github.com/luishw12',
};
export const REPO_URL = 'https://github.com/luishw12/feriados-app';

/** Anos navegáveis: de 2020 até 5 anos à frente. */
export const MIN_YEAR = 2020;
export function currentYear(): number {
  return Number(todayInBrazil().slice(0, 4));
}
export function maxYear(): number {
  return currentYear() + 5;
}
export function isValidYear(value: string | number | undefined): value is string | number {
  if (value === undefined) return false;
  const str = String(value);
  if (!/^\d{4}$/.test(str)) return false;
  const year = Number(str);
  return year >= MIN_YEAR && year <= maxYear();
}
/** Anos destacados em links e no sitemap. */
export function featuredYears(): number[] {
  const y = currentYear();
  return [y - 1, y, y + 1, y + 2];
}

// ——— URLs canônicas ———

export const paths = {
  home: () => '/',
  year: (year: number) => `/feriados-${year}/`,
  bridges: (year: number) => `/feriados-prolongados-${year}/`,
  state: (uf: string, year?: number) => `/${uf.toLowerCase()}/${year ? `${year}/` : ''}`,
  city: (uf: string, slug: string, year?: number) => `/${uf.toLowerCase()}/${slug}/${year ? `${year}/` : ''}`,
  holiday: (id: string, year?: number) => `/feriado/${id}/${year ? `${year}/` : ''}`,
  next: () => '/proximo-feriado/',
  businessDays: () => '/calculadora-dias-uteis/',
  contribute: () => '/contribuir/',
  api: () => '/api/',
  about: () => '/sobre/',
  privacy: () => '/privacidade/',
  changelog: () => '/changelog/',
  ics: (uf?: string | null, slug?: string | null) =>
    slug && uf ? `/calendario/${uf.toLowerCase()}/${slug}.ics` : uf ? `/calendario/${uf.toLowerCase()}.ics` : '/calendario/brasil.ics',
};

/** Caminho da versão Markdown de uma página (`/sp/campinas/` → `/sp/campinas.md`). */
export function markdownPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/index.md' : `${trimmed}.md`;
}

// ——— rótulos ———

export const KIND_LABEL: Record<Kind, string> = {
  feriado: 'Feriado',
  facultativo: 'Ponto facultativo',
  comemorativa: 'Data comemorativa',
};

export const SCOPE_LABEL: Record<Scope, string> = {
  national: 'Nacional',
  state: 'Estadual',
  municipal: 'Municipal',
};

export const STATUS_LABEL: Record<Status, string> = {
  verified: 'Verificado',
  unverified: 'Não verificado',
  incomplete: 'Nome a confirmar',
};

/** Rótulo curto combinando abrangência e tipo: "Feriado nacional", "Ponto facultativo", … */
export function typeLabel(scope: Scope, kind: Kind): string {
  if (kind === 'comemorativa') return 'Data comemorativa';
  if (kind === 'facultativo') return scope === 'national' ? 'Ponto facultativo' : `Facultativo ${SCOPE_LABEL[scope].toLowerCase()}`;
  return `Feriado ${SCOPE_LABEL[scope].toLowerCase()}`;
}

/** Chave de cor usada nas classes `tone-*` do CSS global. */
export function tone(scope: Scope, kind: Kind): 'national' | 'state' | 'municipal' | 'optional' | 'commemorative' {
  if (kind === 'comemorativa') return 'commemorative';
  if (kind === 'facultativo') return 'optional';
  return scope;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** "SP" → "São Paulo (SP)" */
export function placeLabel(place: { state: { name: string; uf: string } | null; city: { name: string } | null }): string {
  if (place.city && place.state) return `${place.city.name} (${place.state.uf})`;
  if (place.state) return place.state.name;
  return 'Brasil';
}

/** "Faltam 18 dias", "Falta 1 dia", "É hoje!". O layout recalcula no navegador (`data-countdown`). */
export function countdownText(days: number): string {
  if (days === 0) return 'É hoje!';
  return days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`;
}
