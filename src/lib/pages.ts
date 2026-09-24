/**
 * Modelos de página: reúnem dados e textos (título, resposta direta, FAQ) de cada tipo
 * de página. O HTML (.astro) e a versão Markdown para IA (src/lib/seo/markdown.ts)
 * são gerados a partir do mesmo modelo, então nunca divergem.
 */
import {
  countMunicipalWithName,
  getCitiesOfState,
  getHoliday,
  getHolidayHistory,
  getHolidayPlace,
  getHolidaysFor,
  getNearbyCities,
  getOverridesFor,
  toDef,
  type Credit,
  type HolidayRow,
  type MunicipalityRow,
  type Place,
  type StateRow,
} from './data';
import { bridgeInfo, resolveYear, upcoming, type BridgeInfo, type Occurrence } from './holidays/resolve';
import { describeRule, diffDays, formatDayMonth, formatLong, isMovable, todayInBrazil, weekdayName } from './holidays/rules';
import { KIND_LABEL, SITE_NAME, paths, plural, typeLabel } from './site';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Stats {
  feriados: number;
  national: number;
  state: number;
  municipal: number;
  optional: number;
  commemorative: number;
  onWeekdays: number;
  onWeekends: number;
  bridges: number;
}

export interface ListModel {
  type: 'home' | 'year' | 'state' | 'city';
  year: number;
  /** true quando a URL tem o ano explícito (/sp/2027/). */
  explicitYear: boolean;
  place: Place;
  today: string;
  occurrences: Occurrence[];
  next: Occurrence | null;
  stats: Stats;
  title: string;
  description: string;
  h1: string;
  lead: string;
  faq: FaqItem[];
  path: string;
  tags: string[];
  updatedAt: Date;
  cities: Pick<MunicipalityRow, 'ibge' | 'name' | 'slug' | 'capital'>[];
  nearby: MunicipalityRow[];
}

// ——— preposições ———

const STATE_PREPOSITION: Record<string, 'no' | 'na' | 'em'> = {
  AC: 'no', AL: 'em', AP: 'no', AM: 'no', BA: 'na', CE: 'no', DF: 'no', ES: 'no', GO: 'em', MA: 'no', MT: 'em',
  MS: 'em', MG: 'em', PA: 'no', PB: 'na', PR: 'no', PE: 'em', PI: 'no', RJ: 'no', RN: 'no', RS: 'no', RO: 'em',
  RR: 'em', SC: 'em', SP: 'em', SE: 'em', TO: 'no',
};

/** "no Brasil", "na Bahia", "em Campinas (SP)" */
export function placeIn(place: Place): string {
  if (place.city && place.state) return `em ${place.city.name} (${place.state.uf})`;
  if (place.state) return `${STATE_PREPOSITION[place.state.uf] ?? 'em'} ${place.state.name}`;
  return 'no Brasil';
}

/** "do Brasil", "da Bahia", "de Campinas" */
export function placeOf(place: Place): string {
  if (place.city) return `de ${place.city.name}`;
  if (place.state) {
    const prep = STATE_PREPOSITION[place.state.uf];
    return `${prep === 'no' ? 'do' : prep === 'na' ? 'da' : 'de'} ${place.state.name}`;
  }
  return 'do Brasil';
}

function computeStats(list: Occurrence[]): Stats {
  const feriados = list.filter((o) => o.kind === 'feriado');
  return {
    feriados: feriados.length,
    national: feriados.filter((o) => o.scope === 'national').length,
    state: feriados.filter((o) => o.scope === 'state').length,
    municipal: feriados.filter((o) => o.scope === 'municipal').length,
    optional: list.filter((o) => o.kind === 'facultativo').length,
    commemorative: list.filter((o) => o.kind === 'comemorativa').length,
    onWeekdays: feriados.filter((o) => o.weekday >= 1 && o.weekday <= 5).length,
    onWeekends: feriados.filter((o) => o.weekday === 0 || o.weekday === 6).length,
    bridges: feriados.filter((o) => {
      const kind = bridgeInfo(o.date).kind;
      return kind === 'emenda-segunda' || kind === 'emenda-sexta' || kind === 'prolongado';
    }).length,
  };
}

function breakdown(stats: Stats): string {
  const parts = [plural(stats.national, 'nacional', 'nacionais')];
  if (stats.state) parts.push(plural(stats.state, 'estadual', 'estaduais'));
  if (stats.municipal) parts.push(plural(stats.municipal, 'municipal', 'municipais'));
  return parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} e ${parts.at(-1)}`;
}

function nextSentence(next: Occurrence | null, today: string): string {
  if (!next) return '';
  const days = diffDays(today, next.date);
  const when = days === 0 ? 'é hoje' : days === 1 ? 'é amanhã' : `faltam ${plural(days, 'dia', 'dias')}`;
  return `O próximo feriado é ${next.name}, ${formatLong(next.date)} (${when}).`;
}

export function isBridge(o: Pick<Occurrence, 'date' | 'kind'>): BridgeInfo | null {
  if (o.kind !== 'feriado') return null;
  const info = bridgeInfo(o.date);
  return info.kind === 'fim-de-semana' || info.kind === 'meio-de-semana' ? null : info;
}

export async function buildListModel(input: {
  type: ListModel['type'];
  year: number;
  explicitYear: boolean;
  state?: StateRow | null;
  city?: MunicipalityRow | null;
}): Promise<ListModel> {
  const place: Place = { state: input.state ?? null, city: input.city ?? null };
  const rows = await getHolidaysFor({ uf: place.state?.uf ?? null, ibge: place.city?.ibge ?? null });
  const overrides = await getOverridesFor(rows.filter((r) => r.scope !== 'national').map((r) => r.id));
  const defs = rows.map(toDef);
  const today = todayInBrazil();
  const occurrences = resolveYear(defs, input.year, overrides);
  const [next] = upcoming(defs, today, 1, overrides, (o) => o.kind === 'feriado');
  const stats = computeStats(occurrences);
  const updatedAt = new Date(Math.max(...rows.map((r) => r.updatedAt.getTime())));
  const { year } = input;
  const inPlace = placeIn(place);

  let path: string;
  let h1: string;
  let title: string;
  const tags = ['national'];
  if (place.city && place.state) {
    path = paths.city(place.state.uf, place.city.slug, input.explicitYear ? year : undefined);
    h1 = `Feriados em ${place.city.name} (${place.state.uf}) ${year}`;
    title = `Feriados ${year} em ${place.city.name} (${place.state.uf}): calendário completo`;
    tags.push(`uf:${place.state.uf}`, `city:${place.city.ibge}`);
  } else if (place.state) {
    path = paths.state(place.state.uf, input.explicitYear ? year : undefined);
    h1 = `Feriados ${inPlace} ${year}`;
    title = `Feriados ${year} ${inPlace} (${place.state.uf}): estaduais e nacionais`;
    tags.push(`uf:${place.state.uf}`);
  } else if (input.type === 'year') {
    path = paths.year(year);
    h1 = `Feriados ${year} no Brasil`;
    title = `Feriados ${year}: calendário completo de feriados nacionais`;
  } else {
    path = paths.home();
    h1 = `Feriados ${year} no Brasil`;
    title = `${SITE_NAME}: feriados ${year} nacionais, estaduais e municipais`;
  }

  const lead =
    `${place.city ? place.city.name : place.state ? `O estado ${placeOf(place).replace(/^d[aoe] /, 'de ')}` : 'O Brasil'} tem ${plural(stats.feriados, 'feriado', 'feriados')} em ${year}` +
    `${stats.feriados && (stats.state || stats.municipal) ? ` (${breakdown(stats)})` : place.state ? '' : ' nacionais'}` +
    `${stats.optional ? `, além de ${plural(stats.optional, 'ponto facultativo', 'pontos facultativos')}` : ''}. ` +
    `${plural(stats.onWeekdays, 'cai', 'caem')} em dia de semana${stats.bridges ? ` e ${plural(stats.bridges, 'permite', 'permitem')} feriado prolongado` : ''}.` +
    (next && Number(next.date.slice(0, 4)) <= year ? ` ${nextSentence(next, today)}` : '');

  const description =
    `Lista completa dos feriados ${year} ${inPlace}: ${breakdown(stats)}` +
    `${stats.optional ? ` e ${plural(stats.optional, 'ponto facultativo', 'pontos facultativos')}` : ''}, com dia da semana, emendas e base legal.`;

  const faq = buildListFaq({ place, year, occurrences, stats, next: next ?? null, today });

  const [cities, nearby] = await Promise.all([
    place.state && !place.city ? getCitiesOfState(place.state.uf) : Promise.resolve([]),
    place.city ? getNearbyCities(place.city) : Promise.resolve([]),
  ]);

  return {
    type: input.type,
    year,
    explicitYear: input.explicitYear,
    place,
    today,
    occurrences,
    next: next ?? null,
    stats,
    title,
    description,
    h1,
    lead,
    faq,
    path,
    tags,
    updatedAt,
    cities,
    nearby,
  };
}

function listNames(list: Occurrence[]): string {
  const items = list.map((o) => `${o.name} (${formatDayMonth(o.date)}, ${weekdayName(o.date)})`);
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join('; ')} e ${items.at(-1)}`;
}

function buildListFaq(ctx: { place: Place; year: number; occurrences: Occurrence[]; stats: Stats; next: Occurrence | null; today: string }): FaqItem[] {
  const { place, year, occurrences, stats, next, today } = ctx;
  const inPlace = placeIn(place);
  const feriados = occurrences.filter((o) => o.kind === 'feriado');
  const faq: FaqItem[] = [
    {
      q: `Quantos feriados tem ${inPlace} em ${year}?`,
      a: `São ${plural(stats.feriados, 'feriado', 'feriados')} em ${year} ${inPlace}: ${breakdown(stats)}. ${plural(stats.onWeekdays, 'cai', 'caem')} em dia de semana e ${plural(stats.onWeekends, 'cai', 'caem')} no fim de semana.`,
    },
  ];
  if (next) faq.push({ q: `Qual é o próximo feriado ${inPlace}?`, a: nextSentence(next, today) });
  const bridges = feriados.filter((o) => isBridge(o));
  if (bridges.length) {
    faq.push({
      q: `Quais são os feriados prolongados de ${year} ${inPlace}?`,
      a: `Caem perto do fim de semana: ${listNames(bridges)}.`,
    });
  }
  if (place.city || place.state) {
    const local = feriados.filter((o) => o.scope === (place.city ? 'municipal' : 'state'));
    faq.push({
      q: place.city ? `Qual é o feriado municipal de ${place.city.name}?` : `Qual é o feriado estadual ${inPlace}?`,
      a: local.length
        ? `${local.length === 1 ? 'O feriado' : 'Os feriados'} ${place.city ? 'municipais' : 'estaduais'} em ${year} ${local.length === 1 ? 'é' : 'são'}: ${listNames(local)}.`
        : `Não há feriado ${place.city ? 'municipal' : 'estadual'} cadastrado. Conhece algum? Você pode sugerir pelo site.`,
    });
    for (const [label, id] of [
      ['o Carnaval', 'carnaval'],
      ['Corpus Christi', 'corpus-christi'],
    ] as const) {
      const occ = occurrences.find((o) => o.id === id || o.merged.includes(id) || (o.name === (id === 'carnaval' ? 'Carnaval' : 'Corpus Christi') && o.kind === 'feriado'));
      if (!occ) continue;
      faq.push({
        q: `${label[0]!.toUpperCase()}${label.slice(1)} é feriado ${inPlace}?`,
        a:
          occ.kind === 'feriado'
            ? `Sim. Em ${year}, ${label} (${formatLong(occ.date)}) é ${typeLabel(occ.scope, occ.kind).toLowerCase()} ${inPlace}.`
            : `Não é feriado obrigatório: ${label} (${formatLong(occ.date)}) é ponto facultativo. Cada empresa decide se haverá expediente.`,
      });
    }
  }
  return faq;
}

// ——— página de um feriado ———

export interface HolidayModel {
  holiday: HolidayRow;
  place: Place;
  year: number;
  explicitYear: boolean;
  today: string;
  /** Ocorrência no ano em foco (a próxima, se a URL não tem ano). */
  focus: { date: string; bridge: BridgeInfo | null } | null;
  years: { year: number; date: string | null }[];
  title: string;
  description: string;
  h1: string;
  lead: string;
  faq: FaqItem[];
  path: string;
  tags: string[];
  indexable: boolean;
  municipalCount: number;
  credits: Credit[];
  history: { action: string; createdAt: Date }[];
  sameDay: Occurrence[];
}

export async function buildHolidayModel(id: string, explicitYear?: number): Promise<HolidayModel | null> {
  const holiday = await getHoliday(id);
  if (!holiday) return null;
  const place = await getHolidayPlace(holiday);
  const overrides = await getOverridesFor([holiday.id]);
  const def = toDef(holiday);
  const today = todayInBrazil();
  const thisYear = Number(today.slice(0, 4));

  let year = explicitYear ?? thisYear;
  let date = resolveYear([def], year, overrides)[0]?.date ?? null;
  if (!explicitYear && (!date || date < today)) {
    const nextDate = resolveYear([def], thisYear + 1, overrides)[0]?.date ?? null;
    if (nextDate) {
      year = thisYear + 1;
      date = nextDate;
    }
  }

  const years = [];
  for (let y = thisYear - 1; y <= thisYear + 5; y++) years.push({ year: y, date: resolveYear([def], y, overrides)[0]?.date ?? null });

  const [history, municipalCount, contextRows] = await Promise.all([
    getHolidayHistory(holiday.id),
    holiday.scope === 'national' ? countMunicipalWithName(holiday.name) : Promise.resolve(0),
    date ? getHolidaysFor({ uf: holiday.uf, ibge: holiday.ibge }) : Promise.resolve([]),
  ]);
  const sameDay = date
    ? resolveYear(contextRows.map(toDef), year).filter((o) => o.date === date && o.id !== holiday.id && !o.merged.includes(holiday.id))
    : [];

  const inPlace = placeIn(place);
  const label = typeLabel(holiday.scope, holiday.kind).toLowerCase();
  const localName = holiday.scope === 'national' ? holiday.name : `${holiday.name} ${place.city ? `em ${place.city.name}` : inPlace}`;
  const h1 = `${holiday.name}${holiday.scope === 'national' ? '' : ` — ${place.city ? `${place.city.name} (${place.state?.uf})` : place.state?.name}`} ${year}`;
  const bridge = date ? isBridge({ date, kind: holiday.kind }) : null;

  const lead = date
    ? `${holiday.name} ${date < today ? 'foi' : 'será'} ${formatLong(date)}. É ${label}${holiday.scope === 'national' ? '' : ` ${inPlace}`}` +
      `${isMovable(holiday.rule) ? ` e tem data móvel (${describeRule(holiday.rule)})` : ` e acontece todo ano em ${describeRule(holiday.rule)}`}.` +
      (bridge ? ` ${bridgeSentence(bridge)}` : '')
    : `${holiday.name} não ocorre em ${year}.`;

  const title = date
    ? `${holiday.name} ${year}${holiday.scope === 'national' ? '' : ` ${place.city ? `em ${place.city.name}` : inPlace}`}: ${weekdayName(date)}, ${formatDayMonth(date)}`
    : `${localName} ${year}`;

  const description = date
    ? `${holiday.name} ${year} cai ${weekdayName(date)}, ${formatDayMonth(date)}. ${KIND_LABEL[holiday.kind]}${holiday.scope === 'national' ? ' nacional' : ` ${inPlace}`}. Veja as datas de outros anos${holiday.legalBasis ? ', a lei' : ''} e se dá para emendar.`
    : `${localName}: datas, história e base legal.`;

  const faq: FaqItem[] = [];
  if (date) {
    faq.push({ q: `Quando é ${holiday.name} em ${year}?`, a: `${holiday.name} ${year} é ${formatLong(date)}.` });
    faq.push({
      q: `${holiday.name} é feriado${holiday.scope === 'national' ? '' : ` ${inPlace}`}?`,
      a:
        holiday.kind === 'feriado'
          ? `Sim, é ${label}${holiday.scope === 'national' ? ' em todo o país' : ` ${inPlace}`}.`
          : holiday.kind === 'facultativo'
            ? `Não é feriado obrigatório: é ponto facultativo. Órgãos públicos costumam fechar, mas empresas privadas decidem se liberam os funcionários.${municipalCount ? ` Em ${plural(municipalCount, 'município', 'municípios')} é feriado municipal.` : ''}`
            : 'Não. É uma data comemorativa, sem folga prevista em lei.',
    });
    if (holiday.kind === 'feriado') {
      faq.push({
        q: `${holiday.name} ${year} tem emenda?`,
        a: bridge ? bridgeSentence(bridge) : `Não: em ${year} cai ${weekdayName(date)}${[0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay()) ? ', no fim de semana' : ''}.`,
      });
    }
    const next = years.find((y) => y.year > year && y.date);
    if (next?.date) faq.push({ q: `Quando é ${holiday.name} em ${next.year}?`, a: `Em ${next.year}, ${holiday.name} será ${formatLong(next.date)}.` });
  }
  if (holiday.legalBasis) faq.push({ q: `Qual lei define ${holiday.name}?`, a: holiday.legalBasis });

  const tags = [`h:${holiday.id}`];
  if (holiday.scope === 'national') tags.push('national');

  return {
    holiday,
    place,
    year,
    explicitYear: explicitYear !== undefined,
    today,
    focus: date ? { date, bridge } : null,
    years,
    title,
    description,
    h1,
    lead,
    faq,
    path: paths.holiday(holiday.id, explicitYear),
    tags,
    indexable: holiday.status !== 'incomplete',
    municipalCount,
    credits: history.credits,
    history: history.revisions,
    sameDay,
  };
}

export function bridgeSentence(bridge: BridgeInfo): string {
  switch (bridge.kind) {
    case 'prolongado':
      return `Forma um feriado prolongado de 3 dias, de ${weekdayName(bridge.start)} (${formatDayMonth(bridge.start)}) a ${weekdayName(bridge.end)} (${formatDayMonth(bridge.end)}).`;
    case 'emenda-segunda':
      return `Cai numa terça-feira: emendando a segunda (${formatDayMonth(bridge.bridgeDay!)}), são 4 dias de folga.`;
    case 'emenda-sexta':
      return `Cai numa quinta-feira: emendando a sexta (${formatDayMonth(bridge.bridgeDay!)}), são 4 dias de folga.`;
    default:
      return '';
  }
}
