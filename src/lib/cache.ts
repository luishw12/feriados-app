import type { AstroGlobal, APIContext } from 'astro';

/** CDN: 6 h "fresco" + até 7 dias servindo a versão anterior enquanto revalida. */
const MAX_AGE = 60 * 60 * 6;
const SWR = 60 * 60 * 24 * 7;

type Ctx = Pick<AstroGlobal | APIContext, 'cache'>;

/**
 * Marca a resposta como cacheável no CDN com as tags usadas na invalidação
 * (`national`, `uf:SP`, `city:3509502`, `h:carnaval`…). Ver src/lib/moderation.ts.
 */
export function cachePage(ctx: Ctx, tags: string[], options: { maxAge?: number; lastModified?: Date } = {}): void {
  ctx.cache.set({
    maxAge: options.maxAge ?? MAX_AGE,
    swr: SWR,
    tags: ['site', ...tags],
    ...(options.lastModified ? { lastModified: options.lastModified } : {}),
  });
}

export function noCache(ctx: Ctx): void {
  ctx.cache.set(false);
}

/** Invalida tags no CDN. Silencioso em dev (sem provider ativo). */
export async function invalidate(ctx: Ctx, tags: string[]): Promise<void> {
  if (!ctx.cache.enabled || tags.length === 0) return;
  try {
    await ctx.cache.invalidate({ tags });
  } catch (error) {
    console.error('[cache] falha ao invalidar', tags, error);
  }
}
