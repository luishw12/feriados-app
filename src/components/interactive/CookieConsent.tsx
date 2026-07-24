import { useEffect, useState } from 'react';
import { enableAnalytics } from '@/lib/analytics';
import {
  CONSENT_CHANGED_EVENT,
  getConsentStatus,
  setConsentStatus,
  type ConsentStatus,
} from '@/lib/consent';

const APPEAR_DELAY_MS = 1200;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const status = getConsentStatus();
    if (status === 'accepted') {
      enableAnalytics();
      return undefined;
    }

    let appearTimer: ReturnType<typeof setTimeout> | undefined;

    if (status === null) {
      appearTimer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    }

    function handleConsentChanged(event: Event): void {
      const detail = (event as CustomEvent<ConsentStatus | null>).detail;
      if (detail === null) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }

    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged);
    return () => {
      if (appearTimer) clearTimeout(appearTimer);
      window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged);
    };
  }, []);

  function handleAccept(): void {
    setConsentStatus('accepted');
    enableAnalytics();
    setVisible(false);
  }

  function handleReject(): void {
    setConsentStatus('rejected');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Preferência de cookies"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-0 z-50 animate-fade-in p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-neutral-700/80 dark:bg-neutral-900/90 sm:flex-row sm:items-center sm:gap-4">
        <p
          id="cookie-consent-description"
          className="min-w-0 flex-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm"
        >
          Usamos cookies opcionais de análise para melhorar o site.{' '}
          <a
            href="/privacidade/"
            className="font-medium text-emerald-700 underline-offset-2 transition-colors duration-150 hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Saiba mais
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 sm:text-sm"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:text-sm"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
}
