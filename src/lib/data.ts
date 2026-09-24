import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { getDb, schema } from './db/client';
import type { HolidayRow, MunicipalityRow, OverrideRow, StateRow } from './db/schema';
import type { HolidayDef, HolidayOverride } from './holidays/resolve';

const { holidays, municipalities, states, holidayOverrides, redirects, revisions, suggestions } = schema;

export type { HolidayRow, MunicipalityRow, StateRow };

/** Contexto geográfico de uma página: Brasil, um estado ou uma cidade. */
export interface Place {
  state: StateRow | null;
  city: MunicipalityRow | null;
}

// Estados e municípios quase nunca mudam: vale memorizar por instância da função.
let statesCache: StateRow[] | undefined;

export async function getStates(): Promise<StateRow[]> {
  statesCache ??= await getDb().select().from(states).orderBy(asc(states.name));
  return statesCache;
}

export async function getState(uf: string): Promise<StateRow | null> {
  const upper = uf.toUpperCase();
  return (await getStates()).find((s) => s.uf === upper) ?? null;
}

export async function getStateBySlug(slug: string): Promise<StateRow | null> {
  return (await getStates()).find((s) => s.slug === slug) ?? null;
}

export async function getCity(uf: string, slug: string): Promise<MunicipalityRow | null> {
  const [row] = await getDb()
    .select()
    .from(municipalities)
    .where(and(eq(municipalities.uf, uf.toUpperCase()), eq(municipalities.slug, slug)))
    .limit(1);
  return row ?? null;
}

export async function getCityByIbge(ibge: number): Promise<MunicipalityRow | null> {
  const [row] = await getDb().select().from(municipalities).where(eq(municipalities.ibge, ibge)).limit(1);
  return row ?? null;
}

export async function getCitiesOfState(uf: string): Promise<Pick<MunicipalityRow, 'ibge' | 'name' | 'slug' | 'capital'>[]> {
  return getDb()
    .select({ ibge: municipalities.ibge, name: municipalities.name, slug: municipalities.slug, capital: municipalities.capital })
    .from(municipalities)
    .where(eq(municipalities.uf, uf.toUpperCase()))
    .orderBy(asc(municipalities.name));
}

/** Cidades mais próximas (distância aproximada em graus — suficiente para ordenar vizinhos). */
export async function getNearbyCities(city: MunicipalityRow, limit = 8): Promise<MunicipalityRow[]> {
  if (city.lat === null || city.lng === null) return [];
  const lat = city.lat;
  const lng = city.lng;
  const scale = Math.cos((lat * Math.PI) / 180) ** 2;
  return getDb()
    .select()
    .from(municipalities)
    .where(sql`${municipalities.ibge} != ${city.ibge} AND abs(${municipalities.lat} - ${lat}) < 1.5 AND abs(${municipalities.lng} - ${lng}) < 1.5`)
    .orderBy(sql`(${municipalities.lat} - ${lat}) * (${municipalities.lat} - ${lat}) + (${municipalities.lng} - ${lng}) * (${municipalities.lng} - ${lng}) * ${scale}`)
    .limit(limit);
}

export function toDef(row: HolidayRow): HolidayDef {
  return {
    id: row.id,
    name: row.name,
    scope: row.scope,
    kind: row.kind,
    rule: row.rule,
    uf: row.uf,
    ibge: row.ibge,
    validFrom: row.validFrom,
    validTo: row.validTo,
    categories: row.categories,
    summary: row.summary,
    legalBasis: row.legalBasis,
    status: row.status,
  };
}

/** Todos os feriados que valem em um lugar: nacionais + estaduais + municipais. */
export async function getHolidaysFor(place: { uf?: string | null; ibge?: number | null }): Promise<HolidayRow[]> {
  const conditions = [eq(holidays.scope, 'national')];
  if (place.uf) conditions.push(and(eq(holidays.scope, 'state'), eq(holidays.uf, place.uf.toUpperCase()))!);
  if (place.ibge) conditions.push(and(eq(holidays.scope, 'municipal'), eq(holidays.ibge, place.ibge))!);
  return getDb()
    .select()
    .from(holidays)
    .where(or(...conditions));
}

export async function getOverridesFor(ids: string[]): Promise<HolidayOverride[]> {
  if (ids.length === 0) return [];
  const rows: OverrideRow[] = await getDb().select().from(holidayOverrides).where(inArray(holidayOverrides.holidayId, ids));
  return rows.map(({ holidayId, year, date, note }) => ({ holidayId, year, date, note }));
}

export async function getHoliday(id: string): Promise<HolidayRow | null> {
  const [row] = await getDb().select().from(holidays).where(eq(holidays.id, id)).limit(1);
  return row ?? null;
}

export async function getHolidayPlace(row: Pick<HolidayRow, 'uf' | 'ibge'>): Promise<Place> {
  const [state, city] = await Promise.all([row.uf ? getState(row.uf) : null, row.ibge ? getCityByIbge(row.ibge) : null]);
  return { state, city };
}

/** Quantos municípios têm um feriado com o mesmo nome (ex.: Corpus Christi é feriado em 211 cidades). */
export async function countMunicipalWithName(name: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(holidays)
    .where(and(eq(holidays.scope, 'municipal'), eq(holidays.name, name)));
  return row?.count ?? 0;
}

export interface Credit {
  name: string;
  link: string | null;
  date: Date;
}

/** Histórico público de alterações de um feriado, com crédito aos contribuidores. */
export async function getHolidayHistory(id: string): Promise<{ revisions: { action: string; createdAt: Date }[]; credits: Credit[] }> {
  const db = getDb();
  const rows = await db
    .select({
      action: revisions.action,
      createdAt: revisions.createdAt,
      contributorName: suggestions.contributorName,
      contributorLink: suggestions.contributorLink,
    })
    .from(revisions)
    .leftJoin(suggestions, eq(revisions.suggestionId, suggestions.id))
    .where(eq(revisions.holidayId, id))
    .orderBy(desc(revisions.createdAt))
    .limit(20);
  const credits = new Map<string, Credit>();
  for (const row of rows) {
    if (row.contributorName && !credits.has(row.contributorName)) {
      credits.set(row.contributorName, { name: row.contributorName, link: row.contributorLink, date: row.createdAt });
    }
  }
  return { revisions: rows.map(({ action, createdAt }) => ({ action, createdAt })), credits: [...credits.values()] };
}

export async function getRedirect(path: string): Promise<string | null> {
  const [row] = await getDb().select().from(redirects).where(eq(redirects.fromPath, path)).limit(1);
  return row?.toPath ?? null;
}

export async function countHolidays(): Promise<{ scope: string; status: string; count: number }[]> {
  return getDb()
    .select({ scope: holidays.scope, status: holidays.status, count: sql<number>`count(*)` })
    .from(holidays)
    .groupBy(holidays.scope, holidays.status);
}

/** Feriados nacionais e estaduais (os que têm página "forte" e entram no sitemap principal). */
export async function getMainHolidays(): Promise<HolidayRow[]> {
  return getDb()
    .select()
    .from(holidays)
    .where(or(eq(holidays.scope, 'national'), eq(holidays.scope, 'state')))
    .orderBy(asc(holidays.scope), asc(holidays.id));
}

export async function getNationalHolidays(): Promise<HolidayRow[]> {
  return getDb().select().from(holidays).where(and(eq(holidays.scope, 'national'), isNull(holidays.uf)));
}
