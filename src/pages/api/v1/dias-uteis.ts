import type { APIRoute } from 'astro';
import { apiError, defsFor, json, placeFromQuery, placeJson, placeTags } from '@/lib/api';
import { businessDays } from '@/lib/holidays/resolve';
import { diffDays, weekdayName } from '@/lib/holidays/rules';

/** GET /api/v1/dias-uteis/?inicio=2026-01-01&fim=2026-12-31&ibge=3509502&facultativos=1 */
export const GET: APIRoute = async (ctx) => {
  const start = ctx.url.searchParams.get('inicio') ?? '';
  const end = ctx.url.searchParams.get('fim') ?? '';
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(start) || !iso.test(end) || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    return apiError(ctx, 400, 'Use inicio e fim no formato AAAA-MM-DD');
  }
  if (Math.abs(diffDays(start, end)) > 366 * 5) return apiError(ctx, 400, 'Intervalo máximo: 5 anos');
  const { place, error } = await placeFromQuery(ctx.url);
  if (error) return apiError(ctx, 404, error);
  const { defs, overrides } = await defsFor(place);
  const result = businessDays(start, end, defs, overrides, { includeOptional: ctx.url.searchParams.get('facultativos') === '1' });
  return json(
    ctx,
    {
      inicio: start <= end ? start : end,
      fim: start <= end ? end : start,
      local: placeJson(place),
      dias_uteis: result.businessDays,
      dias_corridos: result.totalDays,
      feriados_em_dias_uteis: result.holidaysOnWeekdays.map((o) => ({ data: o.date, dia_semana: weekdayName(o.date), nome: o.name, tipo: o.kind, abrangencia: o.scope })),
    },
    { tags: placeTags(place) },
  );
};
