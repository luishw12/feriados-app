import type { APIRoute } from 'astro';
import { apiError, json } from '@/lib/api';
import { getCitiesOfState, getState } from '@/lib/data';

/** GET /api/v1/municipios/?uf=SP */
export const GET: APIRoute = async (ctx) => {
  const state = await getState(ctx.url.searchParams.get('uf') ?? '');
  if (!state) return apiError(ctx, 400, 'Informe ?uf= com uma UF válida');
  const cities = await getCitiesOfState(state.uf);
  return json(ctx, cities.map((c) => ({ ibge: c.ibge, nome: c.name, slug: c.slug, capital: c.capital })), { tags: ['api'] });
};
