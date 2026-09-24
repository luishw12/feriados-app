import type { APIRoute } from 'astro';
import { cachePage } from '@/lib/cache';
import { markdownFor } from '@/lib/seo/markdown';

/** Versão Markdown de qualquer página: /sp/campinas.md, /feriado/carnaval/2027.md, /index.md */
export const GET: APIRoute = async (ctx) => {
  const segments = (ctx.params.path ?? '').split('/').filter((s) => s && s !== 'index');
  const site = ctx.site ?? new URL(ctx.url.origin);
  const result = await markdownFor(segments, site);
  if (!result) return new Response('Não encontrado', { status: 404 });
  cachePage(ctx, result.tags, { lastModified: result.updated });
  const canonical = new URL(`/${segments.map((s) => `${s}/`).join('')}`, site).href;
  return new Response(result.body, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      link: `<${canonical}>; rel="canonical"`,
      'x-robots-tag': 'noindex',
    },
  });
};
