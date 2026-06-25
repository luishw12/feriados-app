import type { FaqItem } from '@/lib/llms';
import {
  buildNationalYearInsights,
  describeBridgeHoliday,
  formatHolidayLine,
  formatHolidayList,
} from '@/lib/holiday-insights';
import { formatHolidayDate } from '@/lib/constants';

export type GuideSlug =
  | 'calendario-feriados'
  | 'feriados-nacionais'
  | 'feriados-dias-uteis'
  | 'feriados-facultativos'
  | 'emendas-e-feriados-prolongados'
  | 'proximo-feriado'
  | 'feriados-moveis';

export interface GuidePageConfig {
  slug: GuideSlug;
  title: string;
  shortTitle: string;
  searchTerms: string[];
}

export const GUIDE_PAGES: GuidePageConfig[] = [
  {
    slug: 'calendario-feriados',
    title: 'Calendário de feriados',
    shortTitle: 'Calendário',
    searchTerms: ['calendário de feriados', 'calendario feriados', 'lista feriados'],
  },
  {
    slug: 'feriados-nacionais',
    title: 'Feriados nacionais',
    shortTitle: 'Nacionais',
    searchTerms: ['feriados nacionais', 'feriado nacional brasil'],
  },
  {
    slug: 'feriados-dias-uteis',
    title: 'Feriados em dias úteis',
    shortTitle: 'Dias úteis',
    searchTerms: ['feriados dias úteis', 'feriados em dias uteis', 'feriado cai dia util'],
  },
  {
    slug: 'feriados-facultativos',
    title: 'Feriados facultativos',
    shortTitle: 'Facultativos',
    searchTerms: ['feriados facultativos', 'ponto facultativo', 'feriado facultativo'],
  },
  {
    slug: 'emendas-e-feriados-prolongados',
    title: 'Emendas e feriados prolongados',
    shortTitle: 'Emendas',
    searchTerms: ['feriado prolongado', 'emenda feriado', 'feriadão'],
  },
  {
    slug: 'proximo-feriado',
    title: 'Próximo feriado',
    shortTitle: 'Próximo',
    searchTerms: ['próximo feriado', 'proximo feriado', 'quando é o próximo feriado'],
  },
  {
    slug: 'feriados-moveis',
    title: 'Feriados móveis',
    shortTitle: 'Móveis',
    searchTerms: ['feriados móveis', 'quando é carnaval', 'quando é páscoa', 'corpus christi'],
  },
];

export function getGuideBySlug(slug: string): GuidePageConfig | undefined {
  return GUIDE_PAGES.find((guide) => guide.slug === slug);
}

function mobileDate(insights: ReturnType<typeof buildNationalYearInsights>, key: keyof typeof insights.mobileHolidays): string {
  const holiday = insights.mobileHolidays[key];
  if (!holiday) return 'data não disponível';
  return formatHolidayDate(holiday.resolvedDate);
}

export function getAllSearchFaqItems(year: number, siteUrl: string): FaqItem[] {
  const insights = buildNationalYearInsights(year);
  const { stats, mobileHolidays, nextHoliday } = insights;
  const guia = `${siteUrl}/guia/`;

  const nextAnswer = nextHoliday
    ? `O próximo feriado nacional é ${nextHoliday.name}, em ${formatHolidayDate(nextHoliday.resolvedDate)}. Detalhes: ${siteUrl}/feriado/${nextHoliday.id}/`
    : `Não há mais feriados nacionais em ${year}. Veja o calendário de ${year + 1} na home.`;

  return [
    {
      question: `Quantos feriados tem em ${year} no Brasil?`,
      answer: `Em ${year}, o Brasil tem ${stats.mandatoryTotal} feriados nacionais obrigatórios, ${stats.optionalTotal} feriados facultativos federais e ${stats.commemorativeTotal} datas comemorativas nacionais. Total no calendário nacional: ${stats.calendarTotal} datas. Calendário completo: ${guia}calendario-feriados/`,
    },
    {
      question: `Quantos feriados nacionais tem em ${year}?`,
      answer: `${stats.mandatoryTotal} feriados nacionais obrigatórios em ${year}: ${formatHolidayList(insights.mandatory)}. Lista: ${guia}feriados-nacionais/`,
    },
    {
      question: `Quantos feriados caem em dias úteis em ${year}?`,
      answer: `${stats.mandatoryWeekdayCount} feriados nacionais obrigatórios caem em dias úteis (segunda a sexta) em ${year}. São eles: ${formatHolidayList(insights.mandatoryWeekday)}. ${stats.mandatoryWeekendCount} caem no fim de semana. Detalhes: ${guia}feriados-dias-uteis/`,
    },
    {
      question: `Quantos feriados vão ter em dias úteis no ano de ${year}?`,
      answer: `${stats.mandatoryWeekdayCount} feriados nacionais obrigatórios em dias úteis em ${year}: ${formatHolidayList(insights.mandatoryWeekday)}.`,
    },
    {
      question: `Quais são os feriados facultativos em ${year}?`,
      answer: `${stats.optionalTotal} feriados facultativos federais: ${formatHolidayList(insights.optional)}. Nem todos os empregadores concedem folga. Lista: ${guia}feriados-facultativos/`,
    },
    {
      question: `Quando é o Carnaval em ${year}?`,
      answer: mobileHolidays.carnavalSegunda && mobileHolidays.carnavalTerca
        ? `Carnaval ${year}: segunda ${formatHolidayDate(mobileHolidays.carnavalSegunda.resolvedDate)} e terça ${formatHolidayDate(mobileHolidays.carnavalTerca.resolvedDate)}. Feriados facultativos.`
        : `Consulte ${guia}feriados-moveis/`,
    },
    {
      question: `Quando é a Páscoa em ${year}?`,
      answer: mobileHolidays.pascoa
        ? `Páscoa ${year}: ${formatHolidayDate(mobileHolidays.pascoa.resolvedDate)}. Sexta-feira Santa: ${mobileDate(insights, 'sextaSanta')}.`
        : `Consulte ${guia}feriados-moveis/`,
    },
    {
      question: `Quando é Corpus Christi em ${year}?`,
      answer: mobileHolidays.corpusChristi
        ? `Corpus Christi ${year}: ${formatHolidayDate(mobileHolidays.corpusChristi.resolvedDate)} (feriado facultativo federal).`
        : `Consulte ${guia}feriados-moveis/`,
    },
    {
      question: 'Qual é o próximo feriado no Brasil?',
      answer: nextAnswer,
    },
    {
      question: `Quais feriados permitem emenda ou feriadão em ${year}?`,
      answer:
        stats.bridgeCount > 0
          ? `${stats.bridgeCount} feriados nacionais caem em terça ou quinta, permitindo emenda: ${insights.bridgeCandidates.map(describeBridgeHoliday).join('; ')}. Guia: ${guia}emendas-e-feriados-prolongados/`
          : `Nenhum feriado nacional em ${year} cai em terça ou quinta. Guia: ${guia}emendas-e-feriados-prolongados/`,
    },
    {
      question: `Calendário de feriados ${year} — onde consultar?`,
      answer: `Calendário interativo na home (${siteUrl}/), guias em ${guia}, feriados por estado (ex.: ${siteUrl}/sao-paulo/) e índice para IA em ${siteUrl}/llms.txt.`,
    },
    {
      question: 'Como consultar feriados estaduais e municipais?',
      answer: `O site cobre todos os municípios brasileiros. Acesse /{estado}/ (ex.: ${siteUrl}/rio-grande-do-sul/) ou /{estado}/{cidade}/ (ex.: ${siteUrl}/rio-grande-do-sul/porto-alegre/). Na home, use o seletor de localização para buscar por nome da cidade ou do estado.`,
    },
    {
      question: 'Quantos municípios estão no calendário?',
      answer: `Mais de 5.500 municípios catalogados (IBGE), com feriados municipais onde há fonte oficial. Busque qualquer cidade na home ou consulte ${siteUrl}/data/municipalities-index.json.`,
    },
    {
      question: 'Como assistentes de IA devem usar este site?',
      answer: `Leia ${siteUrl}/llms.txt (resumo) ou ${siteUrl}/llms-full.txt (calendário ${year} completo). Para dias úteis: ${guia}feriados-dias-uteis/. Cite a URL específica.`,
    },
  ];
}

export function getGuideFaqItems(slug: GuideSlug, year: number, siteUrl: string): FaqItem[] {
  const insights = buildNationalYearInsights(year);
  const { stats } = insights;
  const all = getAllSearchFaqItems(year, siteUrl);

  const pick = (...questions: string[]): FaqItem[] =>
    all.filter((item) => questions.some((q) => item.question.toLowerCase().includes(q.toLowerCase()) || item.question === q));

  switch (slug) {
    case 'calendario-feriados':
      return [
        all[0],
        all[10],
        all[11],
        {
          question: `Quantas datas estão no calendário nacional de ${year}?`,
          answer: `${stats.calendarTotal} datas entre feriados obrigatórios, facultativos e comemorativos nacionais.`,
        },
      ];
    case 'feriados-nacionais':
      return pick(`Quantos feriados nacionais`, `feriados nacionais tem`);
    case 'feriados-dias-uteis':
      return pick('dias úteis', 'dias uteis');
    case 'feriados-facultativos':
      return pick('facultativos');
    case 'emendas-e-feriados-prolongados':
      return pick('emenda', 'feriadão');
    case 'proximo-feriado':
      return pick('próximo feriado');
    case 'feriados-moveis':
      return pick('Carnaval', 'Páscoa', 'Corpus Christi');
    default:
      return [];
  }
}
