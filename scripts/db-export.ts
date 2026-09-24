/**
 * Exporta o banco para data/seed/*.json (dataset aberto versionado no Git).
 * Roda diariamente no GitHub Actions (.github/workflows/export-data.yml).
 */
import { writeFileSync } from 'node:fs';
import { asc } from 'drizzle-orm';
import { connect, schema } from './db.ts';

const { db, client } = connect();
const out = (name: string) => new URL(`../data/seed/${name}`, import.meta.url);

const pretty = (name: string, rows: unknown[]) => writeFileSync(out(name), `${JSON.stringify(rows, null, 2)}\n`);
const lines = (name: string, rows: unknown[]) =>
  writeFileSync(out(name), `[\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]\n`);

const holidays = (await db.select().from(schema.holidays).orderBy(asc(schema.holidays.uf), asc(schema.holidays.ibge), asc(schema.holidays.rule))).map(
  ({ createdAt: _c, updatedAt: _u, ...h }) => ({
    id: h.id,
    name: h.name,
    scope: h.scope,
    uf: h.uf,
    ibge: h.ibge,
    kind: h.kind,
    rule: h.rule,
    validFrom: h.validFrom,
    validTo: h.validTo,
    categories: h.categories,
    summary: h.summary,
    body: h.body,
    legalBasis: h.legalBasis,
    sourceUrl: h.sourceUrl,
    status: h.status,
  }),
);

const nationalOrder = (rule: string) => rule;
pretty('states.json', await db.select().from(schema.states).orderBy(asc(schema.states.uf)));
lines('municipalities.json', await db.select().from(schema.municipalities).orderBy(asc(schema.municipalities.uf), asc(schema.municipalities.slug)));
pretty('holidays-national.json', holidays.filter((h) => h.scope === 'national').sort((a, b) => a.kind.localeCompare(b.kind) || nationalOrder(a.rule).localeCompare(nationalOrder(b.rule))));
pretty('holidays-state.json', holidays.filter((h) => h.scope === 'state'));
lines('holidays-municipal.json', holidays.filter((h) => h.scope === 'municipal'));
pretty(
  'overrides.json',
  (await db.select().from(schema.holidayOverrides).orderBy(asc(schema.holidayOverrides.holidayId), asc(schema.holidayOverrides.year))).map(({ id: _id, ...o }) => o),
);
lines('redirects.json', await db.select().from(schema.redirects).orderBy(asc(schema.redirects.fromPath)));

console.log(`✓ exportados ${holidays.length} feriados para data/seed/`);
client.close();
