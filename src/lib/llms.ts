import { HOLIDAY_TYPE_LABELS, formatHolidayDate } from '@/lib/constants';
import {
  getAllHolidayDefinitions,
  getAllMunicipalityPaths,
  getAllNationalCalendarEvents,
  getAllStates,
  getAllHolidaysForContext,
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

function mdLink(label: string, url: string): string {
  return `[${label}](${url})`;
}

export function getHomeFaqItems(year: number, siteUrl: string): FaqItem[] {
  return getAllSearchFaqItems(year, siteUrl);
}

export function buildLlmsTxt(siteUrl: string, year: number): string {
  const states = getAllStates();
  const definitions = getAllHolidayDefinitions();
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
    `- Para calendário completo em texto: leia \`/llms-full.txt\` (${definitions.length} feriados, ${states.length} estados, calendário ${year}).`,
    '- Para um estado: `/sao-paulo/`, `/rio-grande-do-sul/`, etc.',
    '- Para uma cidade: `/sao-paulo/sao-paulo/`, `/rio-grande-do-sul/porto-alegre/`, etc.',
    '- Para artigo sobre um feriado: `/feriado/tiradentes/`, `/feriado/natal/`, etc.',
    '- Sitemap: `/sitemap-index.xml`',
    '',
    '## Páginas principais',
    '',
    `- [Calendário interativo](${siteUrl}/): feriados nacionais + filtro por estado/cidade`,
    `- [Sobre o projeto](${siteUrl}/sobre/): informações e contribuição`,
    `- [Índice completo para IA](${siteUrl}/llms-full.txt): todas as datas de ${year} em Markdown`,
    '',
    '## Feriados nacionais',
    '',
  ];

  for (const holiday of getAllNationalCalendarEvents(year)) {
    const type = HOLIDAY_TYPE_LABELS[holiday.type];
    lines.push(
      `- [${holiday.name}](${siteUrl}/feriado/${holiday.id}/): ${isoDate(holiday.resolvedDate)} (${type})`,
    );
  }

  lines.push('', '## Estados (27 UFs)', '');

  for (const state of states) {
    const count = getAllHolidaysForContext(year, state.uf).length;
    lines.push(
      `- [${state.name}](${siteUrl}/${state.slug}/): ${count} feriados em ${year} (capital: ${state.capital})`,
    );
  }

  lines.push('', '## Cidades disponíveis', '');

  for (const { state, municipality } of getAllMunicipalityPaths()) {
    lines.push(
      `- [${municipality.name}/${state.uf}](${siteUrl}/${state.slug}/${municipality.slug}/)`,
    );
  }

  lines.push('', '## Perguntas frequentes (buscas comuns)', '');

  for (const faq of getAllSearchFaqItems(year, siteUrl)) {
    lines.push(`### ${faq.question}`, '', faq.answer, '');
  }

  return lines.join('\n');
}

export function buildLlmsFullTxt(siteUrl: string, year: number): string {
  const insights = buildNationalYearInsights(year);
  const { stats } = insights;

  const lines: string[] = [
    `# Feriados Brasil — Índice completo ${year}`,
    '',
    `Gerado em build. Site: ${siteUrl}`,
    '',
    '## Estatísticas nacionais (respostas diretas)',
    '',
    `- Feriados nacionais obrigatórios: ${stats.mandatoryTotal}`,
    `- Feriados em dias úteis (seg–sex): ${stats.mandatoryWeekdayCount}`,
    `- Feriados no fim de semana: ${stats.mandatoryWeekendCount}`,
    `- Feriados facultativos federais: ${stats.optionalTotal}`,
    `- Feriados com potencial de emenda: ${stats.bridgeCount}`,
    `- Próximo feriado: ${insights.nextHoliday ? `${insights.nextHoliday.name} (${isoDate(insights.nextHoliday.resolvedDate)})` : 'N/A'}`,
    '',
    'Guias: ' + `${siteUrl}/guia/feriados-dias-uteis/ | ${siteUrl}/guia/feriados-nacionais/ | ${siteUrl}/guia/proximo-feriado/`,
    '',
    'Formato de cada linha: NOME | DATA-ISO | DATA-LONGA | TIPO | URL',
    '',
    '---',
    '',
    '## Feriados nacionais e comemorativos',
    '',
  ];

  for (const holiday of getAllNationalCalendarEvents(year)) {
    const type = HOLIDAY_TYPE_LABELS[holiday.type];
    lines.push(
      `${holiday.name} | ${isoDate(holiday.resolvedDate)} | ${formatHolidayDate(holiday.resolvedDate)} | ${type} | ${siteUrl}/feriado/${holiday.id}/`,
    );
  }

  lines.push('', '## Calendários por estado', '');

  for (const state of getAllStates()) {
    lines.push(`### ${state.name} (${state.uf})`, `URL: ${siteUrl}/${state.slug}/`, '');

    const holidays = getAllHolidaysForContext(year, state.uf);
    for (const holiday of holidays) {
      const type = HOLIDAY_TYPE_LABELS[holiday.type];
      lines.push(
        `- ${holiday.name} | ${isoDate(holiday.resolvedDate)} | ${type} | ${siteUrl}/feriado/${holiday.id}/`,
      );
    }
    lines.push('');
  }

  lines.push('## Calendários por cidade', '');

  for (const { state, municipality } of getAllMunicipalityPaths()) {
    lines.push(
      `### ${municipality.name} — ${state.name}/${state.uf}`,
      `URL: ${siteUrl}/${state.slug}/${municipality.slug}/`,
      '',
    );

    const holidays = getAllHolidaysForContext(year, state.uf, municipality.slug);
    for (const holiday of holidays) {
      const type = HOLIDAY_TYPE_LABELS[holiday.type];
      lines.push(
        `- ${holiday.name} | ${isoDate(holiday.resolvedDate)} | ${type} | ${siteUrl}/feriado/${holiday.id}/`,
      );
    }
    lines.push('');
  }

  lines.push('## Artigos de feriados (história e curiosidades)', '');

  for (const definition of getAllHolidayDefinitions()) {
    const resolved = resolveHolidayForYear(definition, year);
    const article = getArticleById(definition.id);
    const lead = article?.lead ?? definition.description ?? '';
    lines.push(
      `### ${definition.name}`,
      `- Data ${year}: ${isoDate(resolved.resolvedDate)} (${formatHolidayDate(resolved.resolvedDate)})`,
      `- URL: ${siteUrl}/feriado/${definition.id}/`,
      `- Resumo: ${lead}`,
      '',
    );
  }

  return lines.join('\n');
}
