import type { APIRoute } from 'astro';
import { githubAuthorizeUrl, oauthConfigured } from '@/lib/server/auth';

export const GET: APIRoute = (ctx) => {
  if (!oauthConfigured) return ctx.redirect('/admin/login/');
  const next = ctx.url.searchParams.get('next') ?? '/admin/sugestoes/';
  ctx.cookies.set('fb_next', next.startsWith('/admin/') ? next : '/admin/sugestoes/', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 600 });
  return ctx.redirect(githubAuthorizeUrl(ctx.cookies, new URL('/admin/auth/callback/', ctx.url.origin).href));
};
