import type { APIRoute } from 'astro';
import { asc, eq, or } from 'drizzle-orm';
import { cachePage } from '@/lib/cache';
import { getDb, schema } from '@/lib/db/client';
import { getStates } from '@/lib/data';
import { typeLabel } from '@/lib/site';

/** Índice compacto para a busca no navegador: cidades, estados e feriados nacionais/estaduais. */
export const GET: APIRoute = async (ctx) => {
  const db = getDb();
  const [cities, holidays, states] = await Promise.all([
    db
      .select({ ibge: schema.municipalities.ibge, name: schema.municipalities.name, uf: schema.municipalities.uf, slug: schema.municipalities.slug, capital: schema.municipalities.capital })
      .from(schema.municipalities)
      .orderBy(asc(schema.municipalities.name)),
    db
      .select({ id: schema.holidays.id, name: schema.holidays.name, scope: schema.holidays.scope, kind: schema.holidays.kind, uf: schema.holidays.uf })
      .from(schema.holidays)
      .where(or(eq(schema.holidays.scope, 'national'), eq(schema.holidays.scope, 'state'))),
    getStates(),
  ]);
  cachePage(ctx, ['national', 'index'], { maxAge: 60 * 60 * 24 });
  return Response.json({
    c: cities.map((c) => [c.ibge, c.name, c.uf, c.slug, c.capital ? 1 : 0]),
    h: holidays.map((h) => [h.id, h.name, h.scope === 'state' ? `${typeLabel(h.scope, h.kind)} · ${h.uf}` : typeLabel(h.scope, h.kind)]),
    s: states.map((s) => [s.uf, s.name]),
  });
};
