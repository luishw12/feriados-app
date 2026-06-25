export type HolidayType =
  | 'national'
  | 'state'
  | 'municipal'
  | 'optional'
  | 'state_optional'
  | 'commemorative';

export type HolidayCategory =
  | 'religioso'
  | 'historico'
  | 'civico'
  | 'cultural'
  | 'social';

export interface Holiday {
  id: string;
  name: string;
  date?: string;
  dateRule?: string;
  type: HolidayType;
  categories: HolidayCategory[];
  description?: string;
}

export interface StateHolidayFile {
  uf: string;
  name: string;
  slug: string;
  holidays: Holiday[];
}

export interface MunicipalityHolidayFile {
  ibgeCode: number;
  name: string;
  slug: string;
  uf: string;
  holidays: Holiday[];
}

export interface StateInfo {
  uf: string;
  name: string;
  slug: string;
  capital: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
}

export interface ResolvedHoliday extends Holiday {
  resolvedDate: Date;
  state?: string;
  city?: string;
}

export interface SerializedResolvedHoliday extends Holiday {
  resolvedDate: string;
  state?: string;
  city?: string;
}

export type BrazilRegion = StateInfo['region'];

export interface HolidayArticleImage {
  src: string;
  alt: string;
  credit?: string;
}

export interface HolidayArticleSource {
  label: string;
  url: string;
}

export type ContributorRole = 'suggestion' | 'correction' | 'enrichment';

export interface HolidayContributor {
  name: string;
  socialLabel: string;
  socialUrl: string;
  role: ContributorRole;
}

export interface HolidayArticle {
  id: string;
  lead: string;
  legalBasis?: string;
  history: string[];
  traditions?: string[];
  funFacts?: string[];
  image?: HolidayArticleImage;
  sources?: HolidayArticleSource[];
  contributors?: HolidayContributor[];
}

export interface HolidayScope {
  type: HolidayType;
  uf?: string;
  stateSlug?: string;
  stateName?: string;
  citySlug?: string;
  cityName?: string;
}

export interface HolidayDefinition extends Holiday {
  scopes: HolidayScope[];
}
