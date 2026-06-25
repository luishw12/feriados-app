export function getSiteUrl(site?: URL | string | undefined): string {
  const fromEnv = import.meta.env.PUBLIC_SITE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  if (site) {
    return site.toString().replace(/\/$/, '');
  }
  return 'https://feriados.luishw.com.br';
}

export function absoluteUrl(path: string, site?: URL | string | undefined): string {
  const base = getSiteUrl(site);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
