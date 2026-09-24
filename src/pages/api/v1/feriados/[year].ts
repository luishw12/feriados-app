import type { APIRoute } from 'astro';
import { apiError, defsFor, json, occurrenceJson, placeFromQuery, placeJson, placeTags } from '@/lib/api';
import { resolveYear } from '@/lib/holidays/resolve';
import { isValidYear } from '@/lib/site';

/** GET /api/v1/feriados/2026/?uf=SP&ibge=3509502&tipo=feriado */
export const GET: APIRoute = async (ctx) => {
  const { year = '' } = ctx.params;
  if (!isValidYear(year)) return apiError(ctx, 400, 'Ano inválido');
  const { place, error } = await placeFromQuery(ctx.url);
  if (error) return apiError(ctx, 404, error);
  const { defs, overrides } = await defsFor(place);
  const tipo = ctx.url.searchParams.get('tipo');
  const site = ctx.site ?? new URL(ctx.url.origin);
  const list = resolveYear(defs, Number(year), overrides).filter((o) => !tipo || tipo.split(',').includes(o.kind));
  return json(ctx, { ano: Number(year), local: placeJson(place), total: list.length, feriados: list.map((o) => occurrenceJson(o, site)) }, { tags: placeTags(place) });
};
