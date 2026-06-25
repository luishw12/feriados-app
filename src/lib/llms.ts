import { HOLIDAY_TYPE_LABELS, formatHolidayDate } from '@/lib/constants';
import {
  getAllHolidayDefinitions,
  getAllMunicipalityPaths,
  getAllNationalCalendarEvents,
  getAllStates,
  getHolidaysByCity,
  getHolidaysByState,
  getMunicipalityCoverageStats,
  resolveHolidayForYear,
} from '@/lib/holidays';
import { getAllSearchFaqItems } from '@/lib/search-intents';
import { buildNationalYearInsights, formatHolidayList } from '@/lib/holiday-insights';
import { getArticleById } from '@/lib/articles';

export interface FaqItem {
  question: string;
  answer: string;
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getHomeFaqItems(year: number, siteUrl: string): FaqItem[] {
  return getAllSearchFaqItems(year, siteUrl);
}

export function buildLlmsTxt(siteUrl: string, year: number): string {
  const states = getAllStates();
  const coverage = getMunicipalityCoverageStats();
  const articleCount = getAllHolidayDefinitions().filter((d) => getArticleById(d.id)).length;
  const insights = buildNationalYearInsights(year);
  const { stats } = insights;

  const lines: string[] = [
    '# Feriados Brasil',
    '',
    '> Calendário completo de feriados nacionais, estaduais e municipais do Brasil.',
    '> Idioma: pt-BR. Site 100% estático. Dados atualizados para o ano de build.',
    '',
    `Ano de referência: **${year}**`,
    '',
    '## Cobertura territorial',
    '',
    `- **${coverage.totalMunicipalities.toLocaleString('pt-BR')} municípios** catalogados (IBGE) em todas as 27 UFs`,
    `- **${coverage.municipalitiesWithHolidays.toLocaleString('pt-BR')} municípios** com feriados municipais`,
    `- **${articleCount} artigos** educativos em \`/feriado/{id}/\``,
    `- Índice de cidades para busca: ${siteUrl}/data/municipalities-index.json`,
    '',
    '## Respostas rápidas (buscas frequentes)',
    '',
    `- **Quantos feriados nacionais em ${year}?** ${stats.mandatoryTotal} obrigatórios.`,
    `- **Quantos feriados em dias úteis em ${year}?** ${stats.mandatoryWeekdayCount} nacionais obrigatórios (seg–sex). Lista: ${formatHolidayList(insights.mandatoryWeekday)}`,
    `- **Quantos facultativos em ${year}?** ${stats.optionalTotal} federais.`,
    `- **Próximo feriado:** ${insights.nextHoliday ? `${insights.nextHoliday.name} em ${insights.nextHoliday.resolvedDate.toISOString().split('T')[0]}` : 'consulte a home'}`,
    '',
    '## Guias temáticos (SEO e IA)',
    '',
    `- [Hub de guias](${siteUrl}/guia/)`,
    `- [Calendário ${year}](${siteUrl}/guia/calendario-feriados/)`,
    `- [Feriados nacionais](${siteUrl}/guia/feriados-nacionais/)`,
    `- [Feriados em dias úteis](${siteUrl}/guia/feriados-dias-uteis/)`,
    `- [Feriados facultativos](${siteUrl}/guia/feriados-facultativos/)`,
    `- [Emendas e feriadões](${siteUrl}/guia/emendas-e-feriados-prolongados/)`,
    `- [Próximo feriado](${siteUrl}/guia/proximo-feriado/)`,
    `- [Feriados móveis (Carnaval, Páscoa)](${siteUrl}/guia/feriados-moveis/)`,
    '',
    '## Como usar (assistentes de IA)',
    '',
    '- Para visão geral: leia este arquivo (`/llms.txt`).',
    `- Para feriados municipais em texto: leia \`/llms-full.txt\` (feriados estaduais + municipais de ${year}).`,
    '- Para um estado: `/sao-paulo/`, `/rio-grande-do-sul/`, etc.',
    '- Para uma cidade: `/{estado}/{cidade}/` — ex.: `/rio-grande-do-sul/porto-alegre/`, `/sao-paulo/campinas/`',
    '- Para artigo sobre um feriado: `/feriado/tiradentes/`, `/feriado/natal/`, etc.',
    '- Sitemap: `/sitemap-index.xml`',
    '- Busca de localização na home: combobox por nome de cidade ou estado (ex.: "Lajeado", "RS")',
    '',
    '## Páginas principais',
    '',
    `- [Calendário interativo](${siteUrl}/): feriados nacionais + filtro por estado/cidade`,
    `- [Sobre o projeto](${siteUrl}/sobre/): informações e contribuição`,
    `- [Índice completo para IA](${siteUrl}/llms-full.txt): feriados estaduais e municipais de ${year}`,
    '',
    '## Feriados nacionais',
    '',
  ];

  for (const holiday of getAllNationalCalendarEvents(year)) {
    const type = HOLIDAY_TYPE_LABELS[holiday.type];
    const articleUrl = getArticleById(holiday.id) ? `${siteUrl}/feriado/${holiday.id}/` : null;
    lines.push(
      articleUrl
        ? `- [${holiday.name}](${articleUrl}): ${isoDate(holiday.resolvedDate)} (${type})`
        : `- ${holiday.name}: ${isoDate(holiday.resolvedDate)} (${type})`,
    );
  }

  lines.push('', '## Estados (27 UFs)', '');

  for (const state of states) {
    const stateCoverage = coverage.byState.find((entry) => entry.uf === state.uf);
    const stateHolidayCount = getHolidaysByState(state.uf, year).length;
    const municipalityTotal = stateCoverage?.total ?? 0;
    const municipalityWithHolidays = stateCoverage?.withHolidays ?? 0;
    lines.push(
      `- [${state.name}](${siteUrl}/${state.slug}/): ${stateHolidayCount} feriados estaduais · ${municipalityTotal} municípios (${municipalityWithHolidays} com feriado municipal) · capital: ${state.capital}`,
    );
  }

  lines.push(
    '',
    '## Municípios',
    '',
    `Todos os ${coverage.totalMunicipalities.toLocaleString('pt-BR')} municípios brasileiros têm página em \`/{estado}/{cidade}/\`.`,
    'Exemplos:',
    '',
  );

  const examples = [
    { state: 'rio-grande-do-sul', city: 'porto-alegre', label: 'Porto Alegre/RS' },
    { state: 'sao-paulo', city: 'sao-paulo', label: 'São Paulo/SP' },
    { state: 'rio-de-janeiro', city: 'rio-de-janeiro', label: 'Rio de Janeiro/RJ' },
    { state: 'minas-gerais', city: 'belo-horizonte', label: 'Belo Horizonte/MG' },
    { state: 'bahia', city: 'salvador', label: 'Salvador/BA' },
  ];

  for (const example of examples) {
    lines.push(
      `- [${example.label}](${siteUrl}/${example.state}/${example.city}/)`,
    );
  }

  lines.push(
    '',
    `Lista completa por estado nas páginas \`/{estado}/\`. Índice JSON: ${siteUrl}/data/municipalities-index.json`,
    '',
    '## Perguntas frequentes (buscas comuns)',
    '',
  );

  for (const faq of getAllSearchFaqItems(year, siteUrl)) {
    lines.push(`### ${faq.question}`, '', faq.answer, '');
  }

  return lines.join('\n');
}

export function buildLlmsFullTxt(siteUrl: string, year: number): string {
  const coverage = getMunicipalityCoverageStats();
  const insights = buildNationalYearInsights(year);
  const { stats } = insights;

  const lines: string[] = [
    `# Feriados Brasil — Índice completo ${year}`,
    '',
    `Gerado em build. Site: ${siteUrl}`,
    '',
    '## Estatísticas',
    '',
    `- Municípios catalogados: ${coverage.totalMunicipalities.toLocaleString('pt-BR')}`,
    `- Municípios com feriado municipal: ${coverage.municipalitiesWithHolidays.toLocaleString('pt-BR')}`,
    `- Feriados nacionais obrigatórios: ${stats.mandatoryTotal}`,
    `- Feriados em dias úteis (seg–sex): ${stats.mandatoryWeekdayCount}`,
    `- Feriados facultativos federais: ${stats.optionalTotal}`,
    `- Próximo feriado nacional: ${insights.nextHoliday ? `${insights.nextHoliday.name} (${isoDate(insights.nextHoliday.resolvedDate)})` : 'N/A'}`,
    '',
    'Nacionais e comemorativos: ver `/llms.txt`. Guias: ' +
      `${siteUrl}/guia/feriados-dias-uteis/ | ${siteUrl}/guia/feriados-nacionais/`,
    '',
    'Formato municipal: CIDADE/UF | DATA-ISO | NOME | URL-CIDADE',
    '',
    '---',
    '',
    '## Feriados estaduais',
    '',
  ];

  for (const state of getAllStates()) {
    lines.push(`### ${state.name} (${state.uf})`, `URL: ${siteUrl}/${state.slug}/`, '');

    const holidays = getHolidaysByState(state.uf, year);
    for (const holiday of holidays) {
      const type = HOLIDAY_TYPE_LABELS[holiday.type];
      const articleUrl = getArticleById(holiday.id) ? ` | ${siteUrl}/feriado/${holiday.id}/` : '';
      lines.push(
        `- ${holiday.name} | ${isoDate(holiday.resolvedDate)} | ${type}${articleUrl}`,
      );
    }
    lines.push('');
  }

  lines.push('## Feriados municipais (por cidade)', '');

  for (const { state, municipality } of getAllMunicipalityPaths()) {
    const municipalHolidays = getHolidaysByCity(state.uf, municipality.slug, year);
    if (municipalHolidays.length === 0) continue;

    const cityUrl = `${siteUrl}/${state.slug}/${municipality.slug}/`;
    for (const holiday of municipalHolidays) {
      lines.push(
        `${municipality.name}/${state.uf} | ${isoDate(holiday.resolvedDate)} | ${holiday.name} | ${cityUrl}`,
      );
    }
  }

  lines.push('', '## Artigos de feriados (história e curiosidades)', '');

  for (const definition of getAllHolidayDefinitions()) {
    const article = getArticleById(definition.id);
    if (!article) continue;

    const resolved = resolveHolidayForYear(definition, year);
    lines.push(
      `### ${definition.name}`,
      `- Data ${year}: ${isoDate(resolved.resolvedDate)} (${formatHolidayDate(resolved.resolvedDate)})`,
      `- URL: ${siteUrl}/feriado/${definition.id}/`,
      `- Resumo: ${article.lead}`,
      '',
    );
  }

  return lines.join('\n');
}
