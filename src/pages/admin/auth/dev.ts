import type { APIRoute } from 'astro';
import { createSession, devLoginAllowed } from '@/lib/server/auth';

/** Login local sem GitHub — só existe em `astro dev` sem OAuth configurado. */
export const POST: APIRoute = async (ctx) => {
  if (!devLoginAllowed) return new Response('Não disponível', { status: 404 });
  await createSession(ctx.cookies, { login: 'dev', name: 'Desenvolvedor', avatarUrl: '' });
  const next = String((await ctx.request.formData()).get('next') ?? '');
  return ctx.redirect(next.startsWith('/admin/') ? next : '/admin/sugestoes/');
};
