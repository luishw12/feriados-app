import type { APIRoute } from 'astro';
import { apiError, defsFor, occurrenceJson, placeFromQuery, placeJson } from '@/lib/api';
import { upcoming } from '@/lib/holidays/resolve';
import { diffDays, todayInBrazil } from '@/lib/holidays/rules';

/** GET /api/v1/proximo/?ibge=3509502&n=3 — próximos feriados (padrão: só obrigatórios). */
export const GET: APIRoute = async (ctx) => {
  const { place, error } = await placeFromQuery(ctx.url);
  if (error) return apiError(ctx, 404, error);
  const n = Math.min(Math.max(Number(ctx.url.searchParams.get('n') ?? 1) || 1, 1), 20);
  const all = ctx.url.searchParams.get('todos') === '1';
  const today = todayInBrazil();
  const { defs, overrides } = await defsFor(place);
  const site = ctx.site ?? new URL(ctx.url.origin);
  const list = upcoming(defs, today, n, overrides, (o) => all || o.kind === 'feriado');
  // "Hoje" muda a cada dia: cache curto.
  ctx.cache.set({ maxAge: 60 * 30, swr: 60 * 60, tags: ['site', 'national', 'api'] });
  return new Response(
    JSON.stringify({
      hoje: today,
      local: placeJson(place),
      feriados: list.map((o) => ({ ...occurrenceJson(o, site), dias_ate: diffDays(today, o.date) })),
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } },
  );
};
