import { inject } from '@vercel/analytics';
import { hasAnalyticsConsent } from '@/lib/consent';

type GtagCommand = 'js' | 'config' | 'event' | 'consent';

interface GtagFunction {
  (command: 'js', date: Date): void;
  (command: 'config', measurementId: string): void;
  (command: GtagCommand, ...args: unknown[]): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

let analyticsLoaded = false;

function loadGoogleAnalytics(measurementId: string): void {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  const gtag: GtagFunction = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);
}

export function enableAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent() || analyticsLoaded) return;

  analyticsLoaded = true;
  inject();

  const measurementId = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
  if (typeof measurementId === 'string' && measurementId.length > 0 && measurementId !== 'G-XXXXXXXXXX') {
    loadGoogleAnalytics(measurementId);
  }
}
