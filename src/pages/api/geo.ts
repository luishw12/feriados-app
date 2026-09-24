import type { APIRoute } from 'astro';
import { getCity } from '@/lib/data';
import { noCache } from '@/lib/cache';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Palpite de cidade pelo IP (headers da Vercel). Nada é armazenado. */
export const GET: APIRoute = async (ctx) => {
  noCache(ctx);
  const headers = ctx.request.headers;
  const country = headers.get('x-vercel-ip-country');
  const uf = headers.get('x-vercel-ip-country-region');
  const rawCity = headers.get('x-vercel-ip-city');
  if (country !== 'BR' || !uf || !rawCity) return Response.json(null, { headers: { 'cache-control': 'private, no-store' } });
  const city = await getCity(uf, slugify(decodeURIComponent(rawCity)));
  return Response.json(city ? { uf: city.uf, slug: city.slug, name: city.name } : null, {
    headers: { 'cache-control': 'private, no-store' },
  });
};
