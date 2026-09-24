import type { Occurrence } from '../holidays/resolve';
import type { FaqItem, HolidayModel, ListModel } from '../pages';
import { placeIn } from '../pages';
import { AUTHOR, REPO_URL, SITE_NAME, SITE_TAGLINE, paths, typeLabel } from '../site';

type Json = Record<string, unknown>;

export interface Crumb {
  name: string;
  path: string;
}

export function websiteSchema(site: URL): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': new URL('/#website', site).href,
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: site.href,
    inLanguage: 'pt-BR',
    publisher: organization(site),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${new URL('/busca/', site).href}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

function organization(site: URL): Json {
  return {
    '@type': 'Organization',
    '@id': new URL('/#organization', site).href,
    name: SITE_NAME,
    url: site.href,
    logo: new URL('/favicon.svg', site).href,
    founder: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.linkedin },
    sameAs: [REPO_URL],
  };
}

export function breadcrumbSchema(site: URL, crumbs: Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(c.path, site).href,
    })),
  };
}

export function faqSchema(faq: FaqItem[]): Json | null {
  if (faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

function eventSchema(site: URL, occ: Pick<Occurrence, 'id' | 'name' | 'date' | 'summary' | 'scope' | 'kind'>, location: string): Json {
  return {
    '@type': 'Event',
    name: occ.name,
    startDate: occ.date,
    endDate: occ.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: occ.summary || `${typeLabel(occ.scope, occ.kind)} ${location}.`,
    url: new URL(paths.holiday(occ.id, Number(occ.date.slice(0, 4))), site).href,
    location: { '@type': 'Place', name: location.replace(/^(em|no|na|nos|nas) /, ''), address: { '@type': 'PostalAddress', addressCountry: 'BR' } },
    organizer: { '@type': 'Organization', name: 'Governo do Brasil', url: 'https://www.gov.br' },
  };
}

export function listPageSchemas(site: URL, model: ListModel): Json[] {
  const location = placeIn(model.place);
  const pageUrl = new URL(model.path, site).href;
  const items = model.occurrences.filter((o) => o.kind !== 'comemorativa');
  const page: Json = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl,
    url: pageUrl,
    name: model.title,
    description: model.description,
    inLanguage: 'pt-BR',
    dateModified: model.updatedAt.toISOString(),
    isPartOf: { '@id': new URL('/#website', site).href },
    about: { '@type': 'Thing', name: `Feriados ${model.year} ${location}` },
    mainEntity: {
      '@type': 'ItemList',
      name: model.h1,
      numberOfItems: items.length,
      itemListElement: items.map((o, i) => ({ '@type': 'ListItem', position: i + 1, item: eventSchema(site, o, location) })),
    },
  };
  return [page, faqSchema(model.faq)].filter((x): x is Json => x !== null);
}

export function holidayPageSchemas(site: URL, model: HolidayModel): Json[] {
  const location = placeIn(model.place);
  const pageUrl = new URL(model.path, site).href;
  const page: Json = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    url: pageUrl,
    name: model.title,
    description: model.description,
    inLanguage: 'pt-BR',
    dateModified: model.holiday.updatedAt.toISOString(),
    isPartOf: { '@id': new URL('/#website', site).href },
    ...(model.focus
      ? { mainEntity: { '@context': 'https://schema.org', ...eventSchema(site, { ...model.holiday, date: model.focus.date }, location) } }
      : {}),
  };
  return [page, faqSchema(model.faq)].filter((x): x is Json => x !== null);
}

export function datasetSchema(site: URL): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Feriados do Brasil — nacionais, estaduais e municipais',
    description:
      'Base aberta com os feriados nacionais, estaduais e municipais dos 5.571 municípios brasileiros, com regras de data (inclusive móveis), base legal e status de verificação. Atualizada pela comunidade.',
    url: new URL(paths.api(), site).href,
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
    inLanguage: 'pt-BR',
    keywords: ['feriados', 'feriados municipais', 'feriados estaduais', 'calendário', 'Brasil', 'dias úteis'],
    creator: organization(site),
    spatialCoverage: { '@type': 'Place', name: 'Brasil' },
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: new URL('/api/v1/feriados/2026/', site).href },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${REPO_URL}/tree/main/data/seed` },
    ],
  };
}
