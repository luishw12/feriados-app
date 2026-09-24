import type { APIContext } from 'astro';
import { defsFor, placeTags } from './api';
import { cachePage } from './cache';
import type { Place } from './data';
import { resolveYear } from './holidays/resolve';
import { buildIcs } from './ics';
import { currentYear } from './site';

/** Resposta .ics: ano anterior até dois anos à frente; ?facultativos=0 remove pontos facultativos. */
export async function icsResponse(ctx: APIContext, place: Place, filename: string): Promise<Response> {
  const { defs, overrides } = await defsFor(place);
  const year = currentYear();
  const withOptional = ctx.url.searchParams.get('facultativos') !== '0';
  const list = [year - 1, year, year + 1, year + 2]
    .flatMap((y) => resolveYear(defs, y, overrides))
    .filter((o) => o.kind === 'feriado' || (withOptional && o.kind === 'facultativo'));
  cachePage(ctx, placeTags(place));
  return new Response(buildIcs(place, list, ctx.site ?? new URL(ctx.url.origin)), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `inline; filename="${filename}.ics"`,
      'access-control-allow-origin': '*',
    },
  });
}
