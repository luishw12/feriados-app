import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '@/lib/llms';
import { getSiteUrl } from '@/lib/site-url';

export const GET: APIRoute = () => {
  const siteUrl = getSiteUrl();
  const year = new Date().getFullYear();
  const body = buildLlmsTxt(siteUrl, year);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
