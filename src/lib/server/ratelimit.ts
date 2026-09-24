import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '../db/client';

/**
 * Janela fixa guardada no banco (funciona entre instâncias serverless).
 * Retorna false quando o limite foi atingido.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, count: 1, windowStart })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`CASE WHEN ${schema.rateLimits.windowStart} = ${windowStart} THEN ${schema.rateLimits.count} + 1 ELSE 1 END`,
        windowStart,
      },
    })
    .returning({ count: schema.rateLimits.count });
  return (row?.count ?? 1) <= limit;
}

export async function clearRateLimit(key: string): Promise<void> {
  await getDb().delete(schema.rateLimits).where(eq(schema.rateLimits.key, key));
}
