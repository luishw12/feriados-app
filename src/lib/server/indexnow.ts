import { INDEXNOW_KEY } from 'astro:env/server';

/** Avisa Bing/Yandex (e, por tabela, ChatGPT Search e Copilot) que URLs mudaram. */
export async function pingIndexNow(site: URL, paths: string[]): Promise<void> {
  if (!INDEXNOW_KEY || import.meta.env.DEV || paths.length === 0) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: site.hostname,
        key: INDEXNOW_KEY,
        keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, site).href,
        urlList: [...new Set(paths)].map((p) => new URL(p, site).href),
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error('[indexnow] falha', error);
  }
}

export function indexNowKey(): string | null {
  return INDEXNOW_KEY || null;
}
