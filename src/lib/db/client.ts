import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from 'astro:env/server';
import * as schema from './schema';

export type Db = LibSQLDatabase<typeof schema>;

let client: Client | undefined;
let instance: Db | undefined;

/**
 * Sem TURSO_DATABASE_URL o site usa o SQLite local gerado pelo seed (`.data/feriados.db`).
 * Em produção sem Turso (ex.: preview) esse arquivo vem embutido na função e é somente leitura.
 */
export const isReadOnly = !TURSO_DATABASE_URL && import.meta.env.PROD;

export function getDb(): Db {
  if (!instance) {
    client = createClient({
      url: TURSO_DATABASE_URL || 'file:.data/feriados.db',
      ...(TURSO_AUTH_TOKEN ? { authToken: TURSO_AUTH_TOKEN } : {}),
    });
    instance = drizzle(client, { schema });
  }
  return instance;
}

export { schema };
