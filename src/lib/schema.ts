import type { HolidayArticle, HolidayDefinition, HolidayType, ResolvedHoliday } from '@/data/schema';
import { getArticlePublishedDate } from '@/lib/articles';
import type { FaqItem } from '@/lib/llms';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface HolidaySchemaContext {
  stateName?: string;
  cityName?: string;
}

function resolveOrganizer(
  type: HolidayType,
  context: HolidaySchemaContext,
): { '@type': 'GovernmentOrganization'; name: string } {
  if (type === 'municipal' && context.cityName) {
    return {
      '@type': 'GovernmentOrganization',
      name: `Prefeitura de ${context.cityName}`,
    };
  }

  if ((type === 'state' || type === 'state_optional') && context.stateName) {
    return {
      '@type': 'GovernmentOrganization',
      name: `Governo do Estado de ${context.stateName}`,
    };
  }

  return {
    '@type': 'GovernmentOrganization',
    name: 'Governo Federal do Brasil',
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function mergeSchemaGraph(...nodes: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}

export function buildOrganizationSchema(siteUrl: string, authorName: string) {
  return {
    '@type': 'Organization',
    name: 'Feriados Brasil',
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    founder: {
      '@type': 'Person',
      name: authorName,
    },
  };
}

export function buildWebSiteSchema(siteUrl: string) {
  return {
    '@type': 'WebSite',
    name: 'Feriados Brasil',
    url: siteUrl,
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildAboutPageSchema(siteUrl: string, authorName: string) {
  return mergeSchemaGraph(
    {
      '@type': 'WebPage',
      name: 'Sobre — Feriados Brasil',
      url: `${siteUrl}/sobre/`,
      inLanguage: 'pt-BR',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Feriados Brasil',
        url: siteUrl,
      },
    },
    buildOrganizationSchema(siteUrl, authorName),
  );
}

export function buildFaqSchema(faqItems: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildGuidePageSchema(
  siteUrl: string,
  pageName: string,
  pageUrl: string,
  faqItems: FaqItem[],
  breadcrumbItems: BreadcrumbItem[],
) {
  const nodes: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      name: pageName,
      url: pageUrl,
      inLanguage: 'pt-BR',
      isPartOf: { '@type': 'WebSite', name: 'Feriados Brasil', url: siteUrl },
    },
    buildBreadcrumbSchema(breadcrumbItems),
  ];
  if (faqItems.length > 0) {
    nodes.push(buildFaqSchema(faqItems));
  }
  return mergeSchemaGraph(...nodes);
}

export function buildHomeSchema(siteUrl: string, authorName: string, faqItems?: FaqItem[]) {
  const nodes: Record<string, unknown>[] = [
    buildWebSiteSchema(siteUrl),
    buildOrganizationSchema(siteUrl, authorName),
  ];
  if (faqItems && faqItems.length > 0) {
    nodes.push(buildFaqSchema(faqItems));
  }
  return mergeSchemaGraph(...nodes);
}

export function buildHolidaySchema(
  holidays: ResolvedHoliday[],
  locationName = 'Brasil',
  context: HolidaySchemaContext = {},
) {
  const schemaEvents = holidays.map((holiday) => ({
    '@type': 'Event',
    name: holiday.name,
    startDate: holiday.resolvedDate.toISOString().split('T')[0],
    description: holiday.description,
    location: {
      '@type': 'Place',
      name: locationName,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'BR',
      },
    },
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: resolveOrganizer(holiday.type, context),
  }));

  return mergeSchemaGraph(...schemaEvents);
}

export function buildArticleBreadcrumbItems(
  holidayName: string,
  holidayId: string,
  definition: HolidayDefinition,
  siteUrl: string,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ name: 'Início', url: siteUrl }];

  const municipalScope = definition.scopes.find((scope) => scope.citySlug && scope.stateSlug);
  const stateScope = definition.scopes.find((scope) => scope.stateSlug && !scope.citySlug);

  if (stateScope?.stateSlug) {
    items.push({
      name: stateScope.stateName ?? stateScope.uf ?? stateScope.stateSlug,
      url: `${siteUrl}/${stateScope.stateSlug}/`,
    });
  }

  if (municipalScope?.stateSlug && municipalScope.citySlug) {
    items.push({
      name: municipalScope.cityName ?? municipalScope.citySlug,
      url: `${siteUrl}/${municipalScope.stateSlug}/${municipalScope.citySlug}/`,
    });
  }

  items.push({
    name: holidayName,
    url: `${siteUrl}/feriado/${holidayId}/`,
  });

  return items;
}

export function buildHolidayArticleSchema(
  holiday: ResolvedHoliday,
  article: HolidayArticle,
  scopeLabel: string,
  siteUrl: string,
  ogImage: string,
  breadcrumbItems: BreadcrumbItem[],
) {
  const eventDate = holiday.resolvedDate.toISOString().split('T')[0];
  const pageUrl = `${siteUrl}/feriado/${holiday.id}/`;
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
  const datePublished = getArticlePublishedDate(holiday.id);
  const dateModified = new Date().toISOString().split('T')[0];

  return mergeSchemaGraph(
    {
      '@type': 'Article',
      headline: holiday.name,
      description: article.lead,
      url: pageUrl,
      image: imageUrl,
      datePublished,
      dateModified,
      author: {
        '@type': 'Organization',
        name: 'Feriados Brasil',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Feriados Brasil',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/favicon.svg`,
        },
      },
      mainEntityOfPage: pageUrl,
    },
    {
      '@type': 'Event',
      name: holiday.name,
      startDate: eventDate,
      description: article.lead,
      location: {
        '@type': 'Place',
        name: scopeLabel,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'BR',
        },
      },
      eventStatus: 'https://schema.org/EventScheduled',
    },
    buildBreadcrumbSchema(breadcrumbItems),
  );
}

export function buildStatePageSchema(
  holidays: ResolvedHoliday[],
  stateName: string,
  siteUrl: string,
  stateSlug: string,
) {
  const holidaySchema = buildHolidaySchema(holidays, stateName, { stateName });
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Início', url: siteUrl },
    { name: stateName, url: `${siteUrl}/${stateSlug}/` },
  ]);

  const graph = holidaySchema['@graph'] as Record<string, unknown>[];
  return mergeSchemaGraph(...graph, breadcrumb);
}

export function buildCityPageSchema(
  holidays: ResolvedHoliday[],
  cityName: string,
  stateName: string,
  siteUrl: string,
  stateSlug: string,
  citySlug: string,
) {
  const locationName = `${cityName}, ${stateName}`;
  const holidaySchema = buildHolidaySchema(holidays, locationName, {
    stateName,
    cityName,
  });
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Início', url: siteUrl },
    { name: stateName, url: `${siteUrl}/${stateSlug}/` },
    { name: cityName, url: `${siteUrl}/${stateSlug}/${citySlug}/` },
  ]);

  const graph = holidaySchema['@graph'] as Record<string, unknown>[];
  return mergeSchemaGraph(...graph, breadcrumb);
}
