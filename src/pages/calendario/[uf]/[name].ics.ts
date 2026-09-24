import type { APIRoute } from 'astro';
import { getCity, getState } from '@/lib/data';
import { icsResponse } from '@/lib/ics-route';

/** /calendario/sp/campinas.ics */
export const GET: APIRoute = async (ctx) => {
  const { uf = '', name = '' } = ctx.params;
  const state = /^[a-z]{2}$/.test(uf) ? await getState(uf) : null;
  const city = state ? await getCity(state.uf, name) : null;
  if (!state || !city) return new Response('Não encontrado', { status: 404 });
  return icsResponse(ctx, { state, city }, `feriados-${uf}-${name}`);
};
