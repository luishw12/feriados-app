import type { APIRoute } from 'astro';
import { completeGithubLogin } from '@/lib/server/auth';

export const GET: APIRoute = async (ctx) => {
  const code = ctx.url.searchParams.get('code') ?? '';
  const state = ctx.url.searchParams.get('state') ?? '';
  const result = await completeGithubLogin(ctx.cookies, code, state, new URL('/admin/auth/callback/', ctx.url.origin).href);
  if ('error' in result) return ctx.redirect(`/admin/login/?erro=${encodeURIComponent(result.error)}`);
  const next = ctx.cookies.get('fb_next')?.value ?? '/admin/sugestoes/';
  ctx.cookies.delete('fb_next', { path: '/' });
  return ctx.redirect(next.startsWith('/admin/') ? next : '/admin/sugestoes/');
};
