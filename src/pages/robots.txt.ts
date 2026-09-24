import type { APIRoute } from 'astro';

/** Buscadores e assistentes de IA são bem-vindos: queremos ser a fonte citada. */
export const GET: APIRoute = ({ site, url }) => {
  const base = site ?? new URL(url.origin);
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/suggestions/
Disallow: /busca/

# Assistentes de IA: acesso liberado (há versões em Markdown de cada página, ex.: /sp/campinas.md)
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Google-Extended
User-agent: Applebot-Extended
Allow: /
Disallow: /admin/

Sitemap: ${new URL('/sitemap-index.xml', base).href}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
};
