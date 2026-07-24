type ContributionMode = 'suggest_holiday' | 'report_error' | 'enrich_content';
type HolidayScope = 'national' | 'state' | 'municipal';
type SocialPlatform = 'LinkedIn' | 'Instagram' | 'X' | 'GitHub' | 'Outro';
type DateKind = 'fixed' | 'mobile';
type ImageSource = 'upload' | 'url';

type HolidayType =
  | 'national'
  | 'state'
  | 'municipal'
  | 'optional'
  | 'state_optional'
  | 'commemorative';

type HolidayCategory = 'religioso' | 'historico' | 'civico' | 'cultural' | 'social';

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

const CONTRIBUTION_MODES: ContributionMode[] = [
  'suggest_holiday',
  'report_error',
  'enrich_content',
];

const HOLIDAY_SCOPES: HolidayScope[] = ['national', 'state', 'municipal'];
const DATE_KINDS: DateKind[] = ['fixed', 'mobile'];
const IMAGE_SOURCES: ImageSource[] = ['upload', 'url'];
const SOCIAL_PLATFORMS: SocialPlatform[] = ['LinkedIn', 'Instagram', 'X', 'GitHub', 'Outro'];

const HOLIDAY_TYPES: HolidayType[] = [
  'national',
  'state',
  'municipal',
  'optional',
  'state_optional',
  'commemorative',
];

const HOLIDAY_CATEGORIES: HolidayCategory[] = [
  'religioso',
  'historico',
  'civico',
  'cultural',
  'social',
];

const DATE_RULE_PATTERN = /^easter[+-]\d+$/;
const FIXED_DATE_PATTERN = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const FORBIDDEN_BODY_KEYS = [
  'token',
  'authorization',
  'password',
  'secret',
  'apikey',
  'api_key',
  'github_token',
  'github_repo',
  'bearer',
];

function truncate(value: string | undefined, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  return value.trim().slice(0, maxLength);
}

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

function includesValue<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

function readOptionalString(
  raw: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | undefined {
  const value = raw[key];
  if (typeof value !== 'string') return undefined;
  return truncate(value, maxLength);
}

function hasForbiddenKeys(raw: Record<string, unknown>): boolean {
  return Object.keys(raw).some((key) => FORBIDDEN_BODY_KEYS.includes(key.toLowerCase()));
}

function sanitizeHoliday(raw: unknown): ContributionHolidayPayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const scopeValue = record.scope;
  const dateKindValue = record.dateKind;
  const typeValue = record.type;

  if (typeof scopeValue !== 'string' || !includesValue(HOLIDAY_SCOPES, scopeValue)) return null;
  if (typeof dateKindValue !== 'string' || !includesValue(DATE_KINDS, dateKindValue)) return null;
  if (typeof typeValue !== 'string' || !includesValue(HOLIDAY_TYPES, typeValue)) return null;

  const categoriesRaw = record.categories;
  if (!Array.isArray(categoriesRaw)) return null;
  const categories = categoriesRaw.filter(
    (item): item is HolidayCategory =>
      typeof item === 'string' && includesValue(HOLIDAY_CATEGORIES, item),
  );
  if (categories.length === 0) return null;

  const name = readOptionalString(record, 'name', 200);
  if (!name) return null;

  return {
    name,
    dateKind: dateKindValue,
    date: readOptionalString(record, 'date', 10),
    dateRule: readOptionalString(record, 'dateRule', 30),
    type: typeValue,
    categories,
    description: readOptionalString(record, 'description', 5000),
    scope: scopeValue,
    state: readOptionalString(record, 'state', 2),
    city: readOptionalString(record, 'city', 100),
    citySlug: readOptionalString(record, 'citySlug', 100),
  };
}

function sanitizeArticle(raw: unknown): ContributionArticlePayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const imageSourceValue = record.imageSource;
  if (typeof imageSourceValue !== 'string' || !includesValue(IMAGE_SOURCES, imageSourceValue)) {
    return null;
  }

  const lead = readOptionalString(record, 'lead', 2000);
  const history = readOptionalString(record, 'history', 10000);
  const imageAlt = readOptionalString(record, 'imageAlt', 300);
  const sourceLabel = readOptionalString(record, 'sourceLabel', 200);
  const sourceUrl = readOptionalString(record, 'sourceUrl', 500);

  if (!lead || !history || !imageAlt || !sourceLabel || !sourceUrl) return null;

  return {
    lead,
    legalBasis: readOptionalString(record, 'legalBasis', 2000),
    history,
    traditions: readOptionalString(record, 'traditions', 5000),
    funFacts: readOptionalString(record, 'funFacts', 5000),
    imageAlt,
    imageCredit: readOptionalString(record, 'imageCredit', 300),
    imageSource: imageSourceValue,
    imageUrl: readOptionalString(record, 'imageUrl', 1000),
    imageData: readOptionalString(record, 'imageData', 3_000_000),
    imageFileName: readOptionalString(record, 'imageFileName', 200),
    imageMimeType: readOptionalString(record, 'imageMimeType', 50),
    sourceLabel,
    sourceUrl,
  };
}

export function sanitizePayload(raw: Record<string, unknown>): ContributionPayload | null {
  if (hasForbiddenKeys(raw)) return null;

  const typeValue = raw.type;
  if (typeof typeValue !== 'string' || !includesValue(CONTRIBUTION_MODES, typeValue)) return null;

  const holiday = sanitizeHoliday(raw.holiday);
  const article = sanitizeArticle(raw.article);
  if (!holiday || !article) return null;

  const socialValue = raw.contributorSocialPlatform;
  const contributorSocialPlatform =
    typeof socialValue === 'string' && includesValue(SOCIAL_PLATFORMS, socialValue)
      ? socialValue
      : undefined;

  const source = readOptionalString(raw, 'source', 5000) ?? '';

  return {
    type: typeValue,
    holidayId: readOptionalString(raw, 'holidayId', 100),
    pageUrl: readOptionalString(raw, 'pageUrl', 500),
    holiday,
    article,
    source,
    changeNotes: readOptionalString(raw, 'changeNotes', 5000),
    contributorName: readOptionalString(raw, 'contributorName', 100),
    contributorSocialPlatform,
    contributorSocialUrl: readOptionalString(raw, 'contributorSocialUrl', 500),
    website: readOptionalString(raw, 'website', 200),
  };
}

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

  if (!isNonEmpty(article.imageMimeType)) {
    return 'Tipo da imagem inválido.';
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(article.imageMimeType)) {
    return 'Formato de imagem não suportado. Use JPG, PNG ou WebP.';
  }

  try {
    const bytes = Buffer.from(article.imageData, 'base64');
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return 'A imagem deve ter no máximo 2 MB.';
    }
  } catch {
    return 'Não foi possível processar a imagem enviada.';
  }

  return null;
}

function validateHoliday(holiday: ContributionHolidayPayload, type: ContributionMode): string | null {
  if (!isNonEmpty(holiday.name)) {
    return 'Informe o nome do feriado.';
  }

  if (!holiday.scope) {
    return 'Selecione o escopo do feriado.';
  }

  if (holiday.scope !== 'national' && !isNonEmpty(holiday.state)) {
    return 'Informe o estado (UF) do feriado.';
  }

  if (holiday.scope === 'municipal') {
    if (!isNonEmpty(holiday.city)) {
      return 'Informe a cidade do feriado.';
    }
    if (type === 'suggest_holiday' && !isNonEmpty(holiday.citySlug)) {
      return 'Informe o slug da cidade.';
    }
  }

  if (holiday.dateKind === 'fixed') {
    if (!isNonEmpty(holiday.date)) {
      return 'Informe a data fixa no formato MM-DD.';
    }
    if (!FIXED_DATE_PATTERN.test(holiday.date)) {
      return 'Data fixa inválida. Use o formato MM-DD (ex.: 09-20).';
    }
  } else if (!isNonEmpty(holiday.dateRule)) {
    return 'Informe a regra de data móvel (ex.: easter-47).';
  } else if (!DATE_RULE_PATTERN.test(holiday.dateRule)) {
    return 'Regra de data móvel inválida. Use o formato easter+N ou easter-N.';
  }

  if (holiday.categories.length === 0) {
    return 'Selecione ao menos uma categoria.';
  }

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

  if (!isNonEmpty(article.sourceLabel)) {
    return 'Informe o nome da fonte oficial.';
  }

  if (!isNonEmpty(article.sourceUrl)) {
    return 'Informe o link da fonte oficial.';
  }

  if (!isValidUrl(article.sourceUrl)) {
    return 'O link da fonte deve ser uma URL válida (https://...).';
  }

  return validateImage(article, requireImage);
}

export function validatePayload(payload: ContributionPayload): string | null {
  if (isNonEmpty(payload.website)) {
    return '__honeypot__';
  }

  if (!isNonEmpty(payload.source)) {
    return 'Informe a fonte oficial ou referência legal da alteração.';
  }

  const hasContributorName = isNonEmpty(payload.contributorName);
  const hasSocialPlatform = isNonEmpty(payload.contributorSocialPlatform);
  const hasSocialUrl = isNonEmpty(payload.contributorSocialUrl);

  if (hasContributorName || hasSocialPlatform || hasSocialUrl) {
    if (!hasContributorName || !hasSocialPlatform || !hasSocialUrl) {
      return 'Preencha nome, rede social e link do perfil para crédito público.';
    }
    if (!isValidUrl(payload.contributorSocialUrl)) {
      return 'O link da rede social deve ser uma URL válida.';
    }
  }

  if (payload.type === 'suggest_holiday') {
    const holidayError = validateHoliday(payload.holiday, payload.type);
    if (holidayError) return holidayError;

    const articleError = validateArticle(payload.article, payload.type, true);
    if (articleError) return articleError;

    return null;
  }

  if (!isNonEmpty(payload.holidayId)) {
    return 'Feriado não identificado.';
  }

  if (payload.type === 'report_error') {
    const holidayError = validateHoliday(payload.holiday, payload.type);
    if (holidayError) return holidayError;

    const articleError = validateArticle(payload.article, payload.type, false);
    if (articleError) return articleError;

    if (!isNonEmpty(payload.changeNotes)) {
      return 'Descreva o que foi corrigido.';
    }

    return null;
  }

  if (!isNonEmpty(payload.changeNotes)) {
    return 'Descreva a informação que deseja adicionar.';
  }

  const articleError = validateArticle(payload.article, payload.type, false);
  return articleError;
}

export type { ContributionMode, ContributionPayload };
