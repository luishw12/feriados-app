/**
 * Versão Markdown das páginas, pensada para leitura por IA (ChatGPT, Claude,
 * Perplexity…): resposta direta primeiro, tabela limpa e fontes, sem navegação.
 */
import { getCity, getState } from '../data';
import { describeRule, formatDayMonth, formatShort, weekdayName } from '../holidays/rules';
import { buildHolidayModel, buildListModel, isBridge, type HolidayModel, type ListModel } from '../pages';
import { SITE_NAME, STATUS_LABEL, currentYear, isValidYear, paths, placeLabel, typeLabel } from '../site';


function header(title: string, url: string, updated: Date): string {
  return `# ${title}\n\n> Fonte: ${SITE_NAME} — ${url}\n> Atualizado em ${updated.toISOString().slice(0, 10)}\n`;
}

function faq(items: { q: string; a: string }[]): string {
  if (!items.length) return '';
  return `\n## Perguntas frequentes\n\n${items.map((f) => `### ${f.q}\n\n${f.a}\n`).join('\n')}`;
}

export function listToMarkdown(model: ListModel, site: URL): string {
  const url = new URL(model.path, site).href;
  const rows = model.occurrences.map((o) => {
    const bridge = isBridge(o);
    const notes = [bridge ? (bridge.kind === 'prolongado' ? 'prolongado' : `emenda (${bridge.days} dias)`) : '', o.status !== 'verified' ? STATUS_LABEL[o.status].toLowerCase() : '']
      .filter(Boolean)
      .join('; ');
    return `| ${formatShort(o.date)} | ${weekdayName(o.date)} | [${o.name}](${new URL(paths.holiday(o.id, model.year), site).href}) | ${typeLabel(o.scope, o.kind)} | ${notes} |`;
  });
  const parts = [
    header(model.h1, url, model.updatedAt),
    model.lead,
    `\n## Calendário ${model.year}\n`,
    '| Data | Dia da semana | Nome | Tipo | Observações |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    faq(model.faq),
  ];
  if (model.cities.length && model.place.state) {
    parts.push(
      `\n## Municípios de ${model.place.state.name}\n\n${model.cities.map((c) => `[${c.name}](${new URL(paths.city(model.place.state!.uf, c.slug), site).href})`).join(' · ')}\n`,
    );
  }
  parts.push(`\n---\nDados abertos: ${new URL(paths.api(), site).href} · Sugira correções: ${url}\n`);
  return parts.join('\n');
}

export function holidayToMarkdown(model: HolidayModel, site: URL): string {
  const { holiday } = model;
  const url = new URL(model.path, site).href;
  const parts = [
    header(model.h1, url, holiday.updatedAt),
    model.lead,
    '',
    `- **Tipo:** ${typeLabel(holiday.scope, holiday.kind)}`,
    `- **Onde vale:** ${placeLabel(model.place)}`,
    `- **Regra da data:** ${describeRule(holiday.rule)}`,
    `- **Base legal:** ${holiday.legalBasis || 'não informada'}`,
    holiday.sourceUrl ? `- **Fonte:** ${holiday.sourceUrl}` : '',
    `- **Status:** ${STATUS_LABEL[holiday.status]}`,
    holiday.body ? `\n## Sobre\n\n${holiday.body}\n` : holiday.summary ? `\n${holiday.summary}\n` : '',
    '\n## Datas\n',
    '| Ano | Data | Dia da semana |',
    '| --- | --- | --- |',
    ...model.years.map((y) => `| ${y.year} | ${y.date ? formatDayMonth(y.date) : 'não ocorre'} | ${y.date ? weekdayName(y.date) : '—'} |`),
    faq(model.faq),
  ];
  return parts.filter((p) => p !== '').join('\n');
}

/** Resolve o caminho de uma página pública para o seu Markdown. */
export async function markdownFor(segments: string[], site: URL): Promise<{ body: string; tags: string[]; updated: Date } | null> {
  const [a, b, c] = segments;
  if (segments.length === 0) {
    const m = await buildListModel({ type: 'home', year: currentYear(), explicitYear: false });
    return { body: listToMarkdown(m, site), tags: m.tags, updated: m.updatedAt };
  }
  if (a === 'feriado' && b) {
    if (c && !isValidYear(c)) return null;
    const m = await buildHolidayModel(b, c ? Number(c) : undefined);
    return m ? { body: holidayToMarkdown(m, site), tags: m.tags, updated: m.holiday.updatedAt } : null;
  }
  const yearMatch = a ? /^feriados-(\d{4})$/.exec(a) : null;
  if (yearMatch && segments.length === 1) {
    if (!isValidYear(yearMatch[1])) return null;
    const m = await buildListModel({ type: 'year', year: Number(yearMatch[1]), explicitYear: true });
    return { body: listToMarkdown(m, site), tags: m.tags, updated: m.updatedAt };
  }
  if (a && /^[a-z]{2}$/.test(a) && segments.length <= 3) {
    const state = await getState(a);
    if (!state) return null;
    let city = null;
    let year: number | undefined;
    if (b && /^\d{4}$/.test(b)) year = Number(b);
    else if (b) city = await getCity(state.uf, b);
    if (b && !year && !city) return null;
    if (c) year = Number(c);
    if (year !== undefined && !isValidYear(year)) return null;
    const m = await buildListModel({ type: city ? 'city' : 'state', year: year ?? currentYear(), explicitYear: year !== undefined, state, city });
    return { body: listToMarkdown(m, site), tags: m.tags, updated: m.updatedAt };
  }
  return null;
}
