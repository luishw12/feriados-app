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
    title: 'Sobre — Feriados Brasil',
    description:
      'Calendário open source de feriados brasileiros — nacionais, estaduais e municipais. Site 100% estático, com calendário interativo, artigos educativos e formulário para contribuir com novos feriados.',
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
    title: `Guias de Feriados ${year} — Calendário, Dias Úteis, Facultativos e Mais`,
    description: `Respostas diretas sobre feriados ${year}: calendário completo, quantos caem em dias úteis, facultativos, emendas, próximo feriado e datas móveis.`,
    canonical: '/guia/',
  };
}

export function getGuideMeta(slug: string, title: string, description: string, year: number): PageMeta {
  return {
    title: `${title} ${year} — Feriados Brasil`,
    description: truncateDescription(description),
    canonical: `/guia/${slug}/`,
  };
}
