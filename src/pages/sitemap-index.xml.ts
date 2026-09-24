import type { APIRoute } from 'astro';
import { cachePage } from '@/lib/cache';
import { sitemapNames } from '@/lib/seo/sitemap';

export const GET: APIRoute = async (ctx) => {
  const site = ctx.site ?? new URL(ctx.url.origin);
  const names = await sitemapNames();
  cachePage(ctx, ['sitemap', 'national'], { maxAge: 60 * 60 });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${names.map((n) => `  <sitemap><loc>${new URL(`/sitemap/${n}.xml`, site).href}</loc></sitemap>`).join('\n')}
</sitemapindex>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
