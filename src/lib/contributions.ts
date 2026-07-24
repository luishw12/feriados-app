import type {
  HolidayCategory,
  HolidayContributor,
  HolidayDefinition,
  HolidayType,
  HolidayArticle,
} from '@/data/schema';
import { slugify } from '@/lib/text';

export type ContributionMode = 'suggest_holiday' | 'report_error' | 'enrich_content';

export type HolidayScope = 'national' | 'state' | 'municipal';

export type SocialPlatform = 'LinkedIn' | 'Instagram' | 'X' | 'GitHub' | 'Outro';

export type DateKind = 'fixed' | 'mobile';

export type ImageSource = 'upload' | 'url';

export interface ContributionHolidayContext {
  id?: string;
  name: string;
  dateKind: DateKind;
  date?: string;
  dateRule?: string;
  type: HolidayType;
  categories: HolidayCategory[];
  description?: string;
  scope: HolidayScope;
  state?: string;
  city?: string;
  citySlug?: string;
}

export interface ContributionArticleContext {
  lead: string;
  legalBasis?: string;
  history: string;
  traditions?: string;
  funFacts?: string;
  imageAlt: string;
  imageCredit?: string;
  imageSource: ImageSource;
  imageUrl?: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface ContributionOpenDetail {
  mode: ContributionMode;
  holidayId?: string;
  holidayName?: string;
  pageUrl?: string;
  holiday?: ContributionHolidayContext;
  article?: ContributionArticleContext;
}

export interface ContributionHolidayPayload {
  name: string;
  dateKind: DateKind;
  date?: string;
  dateRule?: string;
  type: HolidayType;
  categories: HolidayCategory[];
  description?: string;
  scope: HolidayScope;
  state?: string;
  city?: string;
  citySlug?: string;
}

export interface ContributionArticlePayload {
  lead: string;
  legalBasis?: string;
  history: string;
  traditions?: string;
  funFacts?: string;
  imageAlt: string;
  imageCredit?: string;
  imageSource: ImageSource;
  imageUrl?: string;
  imageData?: string;
  imageFileName?: string;
  imageMimeType?: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface ContributionPayload {
  type: ContributionMode;
  holidayId?: string;
  pageUrl?: string;
  holiday: ContributionHolidayPayload;
  article: ContributionArticlePayload;
  source: string;
  changeNotes?: string;
  contributorName?: string;
  contributorSocialPlatform?: SocialPlatform;
  contributorSocialUrl?: string;
  website?: string;
}

export const OPEN_CONTRIBUTION_EVENT = 'open-contribution';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'LinkedIn',
  'Instagram',
  'X',
  'GitHub',
  'Outro',
];

export const HOLIDAY_SCOPES: { value: HolidayScope; label: string }[] = [
  { value: 'national', label: 'Nacional' },
  { value: 'state', label: 'Estadual' },
  { value: 'municipal', label: 'Municipal' },
];

export const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: 'national', label: 'Nacional' },
  { value: 'state', label: 'Estadual' },
  { value: 'municipal', label: 'Municipal' },
  { value: 'optional', label: 'Facultativo nacional' },
  { value: 'state_optional', label: 'Facultativo estadual' },
  { value: 'commemorative', label: 'Comemorativo' },
];

export const HOLIDAY_CATEGORIES: { value: HolidayCategory; label: string }[] = [
  { value: 'religioso', label: 'Religioso' },
  { value: 'historico', label: 'Histórico' },
  { value: 'civico', label: 'Cívico' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'social', label: 'Social' },
];

export const DATE_RULE_OPTIONS: { value: string; label: string }[] = [
  { value: 'easter+0', label: 'Páscoa (easter+0)' },
  { value: 'easter-2', label: 'Sexta-feira Santa (easter-2)' },
  { value: 'easter-46', label: 'Quarta-feira de Cinzas (easter-46)' },
  { value: 'easter-47', label: 'Carnaval — terça (easter-47)' },
  { value: 'easter-48', label: 'Carnaval — segunda (easter-48)' },
  { value: 'easter+60', label: 'Corpus Christi (easter+60)' },
];

export const CONTRIBUTION_MODE_LABELS: Record<ContributionMode, string> = {
  suggest_holiday: 'Faltou algum feriado?',
  report_error: 'Corrigir feriado',
  enrich_content: 'Enriquecer este artigo',
};

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isExternalImageSrc(src: string): boolean {
  return src.startsWith('https://') || src.startsWith('http://');
}

function joinParagraphs(items?: string[]): string {
  return items?.join('\n') ?? '';
}

function inferScope(definition: HolidayDefinition): HolidayScope {
  const municipal = definition.scopes.find((scope) => scope.citySlug);
  if (municipal) return 'municipal';
  const state = definition.scopes.find((scope) => scope.uf && !scope.citySlug);
  if (state) return 'state';
  return 'national';
}

function defaultTypeForScope(scope: HolidayScope): HolidayType {
  if (scope === 'state') return 'state';
  if (scope === 'municipal') return 'municipal';
  return 'national';
}

export function buildHolidayContextFromDefinition(
  definition: HolidayDefinition,
): ContributionHolidayContext {
  const scope = inferScope(definition);
  const municipalScope = definition.scopes.find((item) => item.citySlug);
  const stateScope = definition.scopes.find((item) => item.uf && !item.citySlug);

  return {
    id: definition.id,
    name: definition.name,
    dateKind: definition.dateRule ? 'mobile' : 'fixed',
    date: definition.date,
    dateRule: definition.dateRule,
    type: definition.type,
    categories: definition.categories,
    description: definition.description,
    scope,
    state: municipalScope?.uf ?? stateScope?.uf,
    city: municipalScope?.cityName,
    citySlug: municipalScope?.citySlug,
  };
}

export function buildArticleContextFromArticle(article: HolidayArticle): ContributionArticleContext {
  const primarySource = article.sources?.[0];

  return {
    lead: article.lead,
    legalBasis: article.legalBasis,
    history: joinParagraphs(article.history),
    traditions: joinParagraphs(article.traditions),
    funFacts: joinParagraphs(article.funFacts),
    imageAlt: article.image?.alt ?? '',
    imageCredit: article.image?.credit,
    imageSource: article.image?.src && isExternalImageSrc(article.image.src) ? 'url' : 'upload',
    imageUrl: article.image?.src && isExternalImageSrc(article.image.src) ? article.image.src : '',
    sourceLabel: primarySource?.label ?? '',
    sourceUrl: primarySource?.url ?? '',
  };
}

export function buildInitialHolidayPayload(
  detail: ContributionOpenDetail,
): ContributionHolidayPayload {
  if (detail.holiday) {
    return {
      name: detail.holiday.name,
      dateKind: detail.holiday.dateKind,
      date: detail.holiday.date ?? '',
      dateRule: detail.holiday.dateRule ?? '',
      type: detail.holiday.type,
      categories: detail.holiday.categories,
      description: detail.holiday.description ?? '',
      scope: detail.holiday.scope,
      state: detail.holiday.state ?? '',
      city: detail.holiday.city ?? '',
      citySlug: detail.holiday.citySlug ?? '',
    };
  }

  return {
    name: detail.holidayName ?? '',
    dateKind: 'fixed',
    date: '',
    dateRule: '',
    type: 'national',
    categories: ['civico'],
    description: '',
    scope: 'national',
    state: '',
    city: '',
    citySlug: '',
  };
}

export function buildInitialArticlePayload(
  detail: ContributionOpenDetail,
): ContributionArticlePayload {
  if (detail.article) {
    return {
      lead: detail.article.lead,
      legalBasis: detail.article.legalBasis ?? '',
      history: detail.article.history,
      traditions: detail.article.traditions ?? '',
      funFacts: detail.article.funFacts ?? '',
      imageAlt: detail.article.imageAlt,
      imageCredit: detail.article.imageCredit ?? '',
      imageSource: detail.article.imageSource,
      imageUrl: detail.article.imageUrl ?? '',
      sourceLabel: detail.article.sourceLabel,
      sourceUrl: detail.article.sourceUrl,
    };
  }

  return {
    lead: '',
    legalBasis: '',
    history: '',
    traditions: '',
    funFacts: '',
    imageAlt: detail.holidayName ? `${detail.holidayName} — banner` : '',
    imageCredit: '',
    imageSource: 'upload',
    imageUrl: '',
    sourceLabel: '',
    sourceUrl: '',
  };
}

export function buildInitialPayload(detail: ContributionOpenDetail): ContributionPayload {
  const holiday = buildInitialHolidayPayload(detail);
  if (detail.mode === 'suggest_holiday' && !detail.holiday) {
    holiday.type = defaultTypeForScope(holiday.scope);
  }

  return {
    type: detail.mode,
    holidayId: detail.holidayId,
    pageUrl: detail.pageUrl ?? (typeof window !== 'undefined' ? window.location.href : ''),
    holiday,
    article: buildInitialArticlePayload(detail),
    source: '',
    changeNotes: '',
    contributorName: '',
    contributorSocialPlatform: undefined,
    contributorSocialUrl: '',
    website: '',
  };
}

export function syncHolidayTypeWithScope(holiday: ContributionHolidayPayload): ContributionHolidayPayload {
  if (holiday.scope === 'national' && holiday.type === 'state') {
    return { ...holiday, type: 'national' };
  }
  if (holiday.scope === 'state' && holiday.type === 'municipal') {
    return { ...holiday, type: 'state' };
  }
  if (holiday.scope === 'municipal' && (holiday.type === 'national' || holiday.type === 'state')) {
    return { ...holiday, type: 'municipal' };
  }
  return holiday;
}

export function autoFillCitySlug(holiday: ContributionHolidayPayload): ContributionHolidayPayload {
  if (holiday.scope !== 'municipal' || holiday.citySlug?.trim()) {
    return holiday;
  }
  if (!holiday.city?.trim()) {
    return holiday;
  }
  return { ...holiday, citySlug: slugify(holiday.city) };
}

const DATE_RULE_PATTERN = /^easter[+-]\d+$/;
const FIXED_DATE_PATTERN = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function validateImage(article: ContributionArticlePayload, requireImage: boolean): string | null {
  if (article.imageSource === 'url') {
    if (requireImage && !isNonEmpty(article.imageUrl)) {
      return 'Informe a URL da imagem de banner.';
    }
    if (isNonEmpty(article.imageUrl) && !isValidUrl(article.imageUrl)) {
      return 'A URL da imagem deve ser válida (https://...).';
    }
    return null;
  }

  if (!isNonEmpty(article.imageData)) {
    return requireImage ? 'Envie a imagem de banner do feriado.' : null;
  }

  return null;
}

function validateHoliday(holiday: ContributionHolidayPayload, type: ContributionMode): string | null {
  if (!isNonEmpty(holiday.name)) return 'Informe o nome do feriado.';
  if (!holiday.scope) return 'Selecione o escopo do feriado.';

  if (holiday.scope !== 'national' && !isNonEmpty(holiday.state)) {
    return 'Informe o estado (UF) do feriado.';
  }

  if (holiday.scope === 'municipal') {
    if (!isNonEmpty(holiday.city)) return 'Informe a cidade do feriado.';
    if (type === 'suggest_holiday' && !isNonEmpty(holiday.citySlug)) {
      return 'Informe o slug da cidade.';
    }
  }

  if (holiday.dateKind === 'fixed') {
    if (!isNonEmpty(holiday.date)) return 'Informe a data fixa no formato MM-DD.';
    if (!FIXED_DATE_PATTERN.test(holiday.date)) {
      return 'Data fixa inválida. Use o formato MM-DD (ex.: 09-20).';
    }
  } else {
    if (!isNonEmpty(holiday.dateRule)) return 'Selecione ou informe a regra de data móvel.';
    if (!DATE_RULE_PATTERN.test(holiday.dateRule)) {
      return 'Regra de data móvel inválida. Use o formato easter+N ou easter-N.';
    }
  }

  if (holiday.categories.length === 0) return 'Selecione ao menos uma categoria.';
  return null;
}

function validateArticle(
  article: ContributionArticlePayload,
  type: ContributionMode,
  requireImage: boolean,
): string | null {
  if (type !== 'enrich_content' && !isNonEmpty(article.lead)) {
    return 'Informe o texto de abertura (lead) do artigo.';
  }

  if (type !== 'enrich_content' && !isNonEmpty(article.history)) {
    return 'Informe ao menos um parágrafo de história.';
  }

  if (!isNonEmpty(article.imageAlt)) {
    return 'Informe o texto alternativo da imagem (acessibilidade).';
  }

  if (!isNonEmpty(article.sourceLabel)) return 'Informe o nome da fonte oficial.';
  if (!isNonEmpty(article.sourceUrl)) return 'Informe o link da fonte oficial.';
  if (!isValidUrl(article.sourceUrl)) {
    return 'O link da fonte deve ser uma URL válida (https://...).';
  }

  return validateImage(article, requireImage);
}

export function validateContribution(payload: ContributionPayload): string | null {
  if (isNonEmpty(payload.website)) return null;

  if (!isNonEmpty(payload.source)) {
    return 'Informe a fonte oficial ou referência legal da alteração.';
  }

  const hasContributorName = isNonEmpty(payload.contributorName);
  const hasSocialPlatform = isNonEmpty(payload.contributorSocialPlatform);
  const hasSocialUrl = isNonEmpty(payload.contributorSocialUrl);

  if (hasContributorName || hasSocialPlatform || hasSocialUrl) {
    if (!hasContributorName) return 'Informe seu nome para receber crédito na página.';
    if (!hasSocialPlatform) return 'Selecione uma rede social.';
    if (!hasSocialUrl) return 'Informe o link do seu perfil na rede social.';
    if (!isValidUrl(payload.contributorSocialUrl)) {
      return 'O link da rede social deve ser uma URL válida (https://...).';
    }
  }

  if (payload.type === 'suggest_holiday') {
    const holidayError = validateHoliday(payload.holiday, payload.type);
    if (holidayError) return holidayError;
    return validateArticle(payload.article, payload.type, true);
  }

  if (!isNonEmpty(payload.holidayId)) return 'Feriado não identificado.';

  if (payload.type === 'report_error') {
    const holidayError = validateHoliday(payload.holiday, payload.type);
    if (holidayError) return holidayError;
    const articleError = validateArticle(payload.article, payload.type, false);
    if (articleError) return articleError;
    if (!isNonEmpty(payload.changeNotes)) return 'Descreva o que foi corrigido.';
    return null;
  }

  if (!isNonEmpty(payload.changeNotes)) {
    return 'Descreva a informação que deseja adicionar.';
  }

  return validateArticle(payload.article, payload.type, false);
}

export function openContributionModal(detail: ContributionOpenDetail): void {
  window.dispatchEvent(new CustomEvent(OPEN_CONTRIBUTION_EVENT, { detail }));
}

export async function submitContribution(
  payload: ContributionPayload,
): Promise<{ ok: true; prUrl: string } | { ok: false; error: string }> {
  const validationError = validateContribution(payload);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (isNonEmpty(payload.website)) {
    return { ok: true, prUrl: '' };
  }

  try {
    const response = await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      if (typeof data === 'object' && data !== null && 'error' in data) {
        const record = data as Record<string, unknown>;
        if (typeof record.error === 'string') {
          return { ok: false, error: record.error };
        }
      }
      return { ok: false, error: 'Não foi possível enviar sua contribuição. Tente novamente.' };
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'ok' in data &&
      (data as Record<string, unknown>).ok === true &&
      'prUrl' in data &&
      typeof (data as Record<string, unknown>).prUrl === 'string'
    ) {
      return { ok: true, prUrl: (data as Record<string, string>).prUrl };
    }

    return { ok: true, prUrl: '' };
  } catch {
    return { ok: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
  }
}

export type { HolidayContributor };
