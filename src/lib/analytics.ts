/**
 * Eventos do Google Analytics 4. O `gtag` só existe depois que a pessoa aceita
 * os cookies de análise (ver `src/components/CookieConsent.astro`); antes disso
 * `track()` não faz nada.
 */

type GtagFunction = (command: 'event', name: string, params?: Record<string, string | number>) => void;

declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

export type AnalyticsEvent =
  /** Resultado escolhido na busca rápida. */
  | 'search_select'
  /** Sugestão enviada com sucesso. */
  | 'suggestion_submit';

export function track(name: AnalyticsEvent, params: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, params);
}

/** Agrupamento de conteúdo (dimensão "Grupo de conteúdo" do GA4) a partir do caminho canônico. */
export function contentGroup(path: string): string {
  if (path === '/') return 'home';
  if (/^\/feriados-\d{4}\/$/.test(path)) return 'ano';
  if (path.startsWith('/feriados-prolongados-')) return 'prolongados';
  if (path.startsWith('/feriado/')) return 'feriado';
  if (/^\/[a-z]{2}\/(\d{4}\/)?$/.test(path)) return 'estado';
  if (/^\/[a-z]{2}\/[^/]+\/(\d{4}\/)?$/.test(path)) return 'cidade';
  return path.split('/')[1] || 'outro';
}
