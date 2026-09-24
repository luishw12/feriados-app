import { defineMiddleware } from 'astro:middleware';
import { getRedirect, getStateBySlug } from './lib/data';
import { currentYear, paths } from './lib/site';

/** Guias da v1 → páginas equivalentes da v2. */
function legacyGuide(slug: string): string | null {
  const year = currentYear();
  switch (slug) {
    case '':
    case 'calendario-feriados':
    case 'feriados-nacionais':
    case 'feriados-facultativos':
    case 'feriados-moveis':
      return paths.year(year);
    case 'feriados-dias-uteis':
      return paths.businessDays();
    case 'emendas-e-feriados-prolongados':
      return paths.bridges(year);
    case 'proximo-feriado':
      return paths.next();
    default:
      return null;
  }
}

const PASSTHROUGH = /^\/(_astro|_image|api|admin|og|favicon|robots\.txt|sitemap|llms|calendario|embed)/;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;

  if (PASSTHROUGH.test(pathname)) return next();

  const segments = pathname.split('/').filter(Boolean);
  const [first, second] = segments;

  if (first === 'guia') {
    const target = legacyGuide(second ?? '');
    if (target) return ctx.redirect(target, 301);
  }

  // /sao-paulo/… (v1) → /sp/…
  if (first && first.length > 2 && !first.includes('.')) {
    const state = await getStateBySlug(first).catch(() => null);
    if (state) return ctx.redirect(`/${state.uf.toLowerCase()}/${segments.slice(1).map((s) => `${s}/`).join('')}`, 301);
  }

  const response = await next();
  if (response.status === 404 && first === 'feriado') {
    const target = await getRedirect(`/feriado/${second ?? ''}/`).catch(() => null);
    if (target) return ctx.redirect(target, 301);
  }
  return response;
});
