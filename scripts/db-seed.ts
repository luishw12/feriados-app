/**
 * Carrega data/seed/*.json no banco. Por padrão só roda em banco vazio;
 * use `--force` para apagar os dados de feriados e recarregar.
 */
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { connect, schema } from './db.ts';

const force = process.argv.includes('--force');
const { db, client } = connect();

function load<T = Record<string, unknown>>(name: string): T[] {
  return JSON.parse(readFileSync(new URL(`../data/seed/${name}`, import.meta.url), 'utf8')) as T[];
}

const [row] = await db.select({ count: sql<number>`count(*)` }).from(schema.holidays);
const count = row?.count ?? 0;
if (count > 0 && !force) {
  console.log(`banco já tem ${count} feriados — nada a fazer (use --force para recarregar)`);
  client.close();
  process.exit(0);
}

async function insertChunks<T extends Record<string, unknown>>(table: Parameters<typeof db.insert>[0], rows: T[], size = 400) {
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size) as never).onConflictDoNothing();
  }
}

if (force) {
  await db.delete(schema.holidayOverrides);
  await db.delete(schema.redirects);
  await db.delete(schema.holidays);
}

type HolidaySeed = typeof schema.holidays.$inferInsert;
const holidays = [
  ...load<HolidaySeed>('holidays-national.json'),
  ...load<HolidaySeed>('holidays-state.json'),
  ...load<HolidaySeed>('holidays-municipal.json'),
];

await insertChunks(schema.states, load('states.json'));
await insertChunks(schema.municipalities, load('municipalities.json'));
await insertChunks(schema.holidays, holidays as never[], 200);
await insertChunks(schema.holidayOverrides, load('overrides.json'));
await insertChunks(schema.redirects, load('redirects.json'));

console.log(`✓ seed: ${holidays.length} feriados`);
client.close();
