import { mkdirSync } from 'node:fs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/db/schema.ts';

export const LOCAL_DB_URL = 'file:.data/feriados.db';

export function connect() {
  const url = process.argv.includes('--local') ? LOCAL_DB_URL : process.env.TURSO_DATABASE_URL || LOCAL_DB_URL;
  if (url.startsWith('file:')) mkdirSync('.data', { recursive: true });
  const client = createClient({ url, ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}) });
  return { client, db: drizzle(client, { schema }), url };
}

export { schema };
