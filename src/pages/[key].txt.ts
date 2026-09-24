import type { APIRoute } from 'astro';
import { indexNowKey } from '@/lib/server/indexnow';

/** Arquivo de verificação do IndexNow: /{INDEXNOW_KEY}.txt */
export const GET: APIRoute = ({ params }) => {
  const key = indexNowKey();
  if (!key || params.key !== key) return new Response('Não encontrado', { status: 404 });
  return new Response(key, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
