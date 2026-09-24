import type { APIRoute } from 'astro';
import { json } from '@/lib/api';
import { getStates } from '@/lib/data';

export const GET: APIRoute = async (ctx) => {
  const states = await getStates();
  return json(ctx, states.map((s) => ({ uf: s.uf, nome: s.name, regiao: s.region, ibge_capital: s.capitalIbge })), { tags: ['api'] });
};
