export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

export function getHomeMeta(year: number): PageMeta {
  return {
    title: `Feriados no Brasil ${year} — Calendário Completo por Estado e Cidade`,
    description: `Calendário de feriados ${year} em mais de 5.500 municípios brasileiros. Nacionais, estaduais e municipais com busca por cidade ou estado.`,
    canonical: '/',
  };
}

export function getStateMeta(
  stateName: string,
  year: number,
  stateSlug: string,
  municipalityCount?: number,
): PageMeta {
  const coverage =
    municipalityCount !== undefined
      ? ` Inclui ${municipalityCount.toLocaleString('pt-BR')} municípios.`
      : '';
  return {
    title: `Feriados em ${stateName} ${year} — Nacionais, Estaduais e Municipais`,
    description: `Calendário completo de feriados em ${stateName} para ${year}. Feriados nacionais, estaduais e municipais por cidade.${coverage}`,
    canonical: `/${stateSlug}/`,
  };
}

export function getCityMeta(
  cityName: string,
  stateName: string,
  uf: string,
  year: number,
  stateSlug: string,
  citySlug: string,
): PageMeta {
  return {
    title: `Feriados em ${cityName}/${uf} ${year} — Calendário Municipal Completo`,
    description: `Todos os feriados em ${cityName}, ${stateName} para ${year}. Inclui feriados municipais, estaduais e nacionais.`,
    canonical: `/${stateSlug}/${citySlug}/`,
  };
}

export function getAboutMeta(): PageMeta {
  return {
    title: 'Sobre o Feriados Brasil — Calendário Open Source Gratuito',
    description:
      'Conheça o Feriados Brasil: calendário open source de feriados nacionais, estaduais e municipais. Site 100% estático, com guias, artigos e formulário para contribuir.',
    canonical: '/sobre/',
  };
}

export function getPrivacyMeta(): PageMeta {
  return {
    title: 'Política de Privacidade — Feriados Brasil',
    description:
      'Como tratamos seus dados pessoais, cookies de análise, geolocalização opcional e seus direitos sob a LGPD.',
    canonical: '/privacidade/',
  };
}

export function getChangelogMeta(): PageMeta {
  return {
    title: 'Novidades — Feriados Brasil',
    description:
      'Histórico de versões e atualizações do Feriados Brasil. Acompanhe novas funcionalidades, correções e melhorias.',
    canonical: '/changelog/',
  };
}

function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getHolidayArticleMeta(
  holidayName: string,
  lead: string,
  holidayId: string,
  year: number,
): PageMeta {
  return {
    title: `${holidayName} — História, data e curiosidades (${year})`,
    description: truncateDescription(lead),
    canonical: `/feriado/${holidayId}/`,
  };
}

export function getGuideHubMeta(year: number): PageMeta {
  return {
    title: `Guias de Feriados ${year} — Calendário, Dias Úteis, Facultativos e Emendas`,
    description: `Respostas diretas sobre feriados ${year}: calendário completo, quantos caem em dias úteis, facultativos, emendas, próximo feriado e datas móveis.`,
    canonical: '/guia/',
  };
}

const GUIDE_SEO_TITLES: Record<string, (year: number) => string> = {
  'calendario-feriados': (year) => `Calendário de Feriados ${year} — Lista Completa Nacional`,
  'feriados-nacionais': (year) => `Feriados Nacionais ${year} — Datas Obrigatórias no Brasil`,
  'feriados-dias-uteis': (year) => `Feriados em Dias Úteis ${year} — Quantos Caem de Seg a Sex`,
  'feriados-facultativos': (year) => `Feriados Facultativos ${year} — Ponto Facultativo Federal`,
  'emendas-e-feriados-prolongados': (year) =>
    `Emendas e Feriadões ${year} — Feriados Prolongados no Brasil`,
  'proximo-feriado': (year) => `Próximo Feriado ${year} — Quando É o Próximo no Brasil`,
  'feriados-moveis': (year) => `Feriados Móveis ${year} — Carnaval, Páscoa e Corpus Christi`,
};

export function getGuideMeta(slug: string, title: string, description: string, year: number): PageMeta {
  const seoTitle = GUIDE_SEO_TITLES[slug]?.(year) ?? `${title} ${year} — Feriados Brasil`;
  return {
    title: seoTitle,
    description: truncateDescription(description),
    canonical: `/guia/${slug}/`,
  };
}
