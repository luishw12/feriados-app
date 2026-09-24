import type { APIRoute } from 'astro';
import { cachePage } from '@/lib/cache';
import { sitemapEntries, xmlEscape } from '@/lib/seo/sitemap';

export const GET: APIRoute = async (ctx) => {
  const site = ctx.site ?? new URL(ctx.url.origin);
  const name = ctx.params.name ?? '';
  const entries = await sitemapEntries(name);
  if (!entries) return new Response('Não encontrado', { status: 404 });
  const uf = /^cidades-([a-z]{2})$/.exec(name)?.[1]?.toUpperCase();
  cachePage(ctx, ['sitemap', 'national', ...(uf ? [`uf:${uf}`] : [])], { maxAge: 60 * 60 });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => `  <url><loc>${xmlEscape(new URL(e.path, site).href)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
