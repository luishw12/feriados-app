export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

export function getHomeMeta(year: number): PageMeta {
  return {
    title: `Feriados no Brasil ${year} — Calendário Completo por Estado e Cidade`,
    description: `Veja todos os feriados nacionais, estaduais e municipais do Brasil em ${year}. Calendário atualizado com datas fixas e móveis por estado e cidade.`,
    canonical: '/',
  };
}

export function getStateMeta(stateName: string, year: number, stateSlug: string): PageMeta {
  return {
    title: `Feriados em ${stateName} ${year} — Nacionais, Estaduais e Municipais`,
    description: `Calendário completo de feriados em ${stateName} para ${year}. Inclui feriados nacionais, estaduais e facultativos com todas as datas.`,
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
      'Projeto open source de calendário de feriados brasileiros. Conheça o autor e contribua com dados de feriados municipais e estaduais.',
    canonical: '/sobre/',
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
