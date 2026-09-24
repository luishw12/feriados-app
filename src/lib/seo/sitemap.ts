import { and, eq, isNotNull, max, ne, or } from 'drizzle-orm';
import { getDb, schema } from '../db/client';
import { getStates } from '../data';
import { currentYear, featuredYears, paths } from '../site';

export interface SitemapEntry {
  path: string;
  lastmod?: Date | undefined;
}

const { holidays, municipalities } = schema;

export async function sitemapNames(): Promise<string[]> {
  const states = await getStates();
  return ['principal', ...states.map((s) => `cidades-${s.uf.toLowerCase()}`)];
}

async function latestNational(): Promise<Date | undefined> {
  const [row] = await getDb().select({ at: max(holidays.updatedAt) }).from(holidays).where(eq(holidays.scope, 'national'));
  return row?.at ?? undefined;
}

export async function sitemapEntries(name: string): Promise<SitemapEntry[] | null> {
  const db = getDb();
  const years = featuredYears();
  const national = await latestNational();

  if (name === 'principal') {
    const states = await getStates();
    const main = await db
      .select({ id: holidays.id, scope: holidays.scope, updatedAt: holidays.updatedAt })
      .from(holidays)
      .where(or(eq(holidays.scope, 'national'), eq(holidays.scope, 'state')));
    const stateUpdated = new Map(
      (
        await db
          .select({ uf: holidays.uf, at: max(holidays.updatedAt) })
          .from(holidays)
          .where(eq(holidays.scope, 'state'))
          .groupBy(holidays.uf)
      ).map((r) => [r.uf, r.at]),
    );
    const latest = (...dates: (Date | null | undefined)[]) => {
      const valid = dates.filter((d): d is Date => d instanceof Date);
      return valid.length ? new Date(Math.max(...valid.map((d) => d.getTime()))) : undefined;
    };
    return [
      { path: paths.home(), lastmod: national },
      ...years.map((y) => ({ path: paths.year(y), lastmod: national })),
      ...years.map((y) => ({ path: paths.bridges(y), lastmod: national })),
      { path: paths.next(), lastmod: national },
      { path: paths.businessDays() },
      { path: paths.contribute() },
      { path: paths.api() },
      { path: paths.about() },
      ...states.flatMap((s) => [
        { path: paths.state(s.uf), lastmod: latest(national, stateUpdated.get(s.uf)) },
        ...years.filter((y) => y !== currentYear()).map((y) => ({ path: paths.state(s.uf, y), lastmod: latest(national, stateUpdated.get(s.uf)) })),
      ]),
      ...main.flatMap((h) => [
        { path: paths.holiday(h.id), lastmod: h.updatedAt },
        ...(h.scope === 'national' ? years.map((y) => ({ path: paths.holiday(h.id, y), lastmod: h.updatedAt })) : []),
      ]),
    ];
  }

  const match = /^cidades-([a-z]{2})$/.exec(name);
  if (!match) return null;
  const uf = match[1]!.toUpperCase();
  const [cities, updates, municipal] = await Promise.all([
    db.select({ ibge: municipalities.ibge, slug: municipalities.slug }).from(municipalities).where(eq(municipalities.uf, uf)),
    db
      .select({ ibge: holidays.ibge, at: max(holidays.updatedAt) })
      .from(holidays)
      .where(and(eq(holidays.uf, uf), isNotNull(holidays.ibge)))
      .groupBy(holidays.ibge),
    db
      .select({ id: holidays.id, updatedAt: holidays.updatedAt })
      .from(holidays)
      .where(and(eq(holidays.scope, 'municipal'), eq(holidays.uf, uf), ne(holidays.status, 'incomplete'))),
  ]);
  const cityUpdated = new Map(updates.map((u) => [u.ibge, u.at]));
  const nextYear = currentYear() + 1;
  return [
    ...cities.flatMap((c) => {
      const lastmod = [cityUpdated.get(c.ibge), national].filter((d): d is Date => d instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0];
      return [
        { path: paths.city(uf, c.slug), lastmod },
        { path: paths.city(uf, c.slug, nextYear), lastmod },
      ];
    }),
    ...municipal.map((h) => ({ path: paths.holiday(h.id), lastmod: h.updatedAt })),
  ];
}

export function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c);
}
