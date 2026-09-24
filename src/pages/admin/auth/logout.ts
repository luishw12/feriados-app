import type { APIRoute } from 'astro';
import { destroySession } from '@/lib/server/auth';

export const POST: APIRoute = async (ctx) => {
  await destroySession(ctx.cookies);
  return ctx.redirect('/admin/login/');
};
