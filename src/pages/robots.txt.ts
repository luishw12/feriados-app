import type { APIRoute } from 'astro';
import { getSiteUrl } from '@/lib/site-url';

export const GET: APIRoute = () => {
  const siteUrl = getSiteUrl();

  const body = [
    '# Índice para assistentes de IA',
    `# Resumo: ${siteUrl}/llms.txt`,
    `# Feriados estaduais e municipais: ${siteUrl}/llms-full.txt`,
    `# Índice de municípios (JSON): ${siteUrl}/data/municipalities-index.json`,
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: anthropic-ai',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
