import type { APIRoute } from 'astro';
import { getState } from '@/lib/data';
import { icsResponse } from '@/lib/ics-route';

/** /calendario/brasil.ics e /calendario/sp.ics */
export const GET: APIRoute = async (ctx) => {
  const name = ctx.params.name ?? '';
  if (name === 'brasil') return icsResponse(ctx, { state: null, city: null }, 'feriados-brasil');
  const state = /^[a-z]{2}$/.test(name) ? await getState(name) : null;
  if (!state) return new Response('Não encontrado', { status: 404 });
  return icsResponse(ctx, { state, city: null }, `feriados-${name}`);
};
