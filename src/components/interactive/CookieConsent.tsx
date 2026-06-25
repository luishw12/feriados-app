import { useEffect, useState } from 'react';
import { enableAnalytics } from '@/lib/analytics';
import {
  CONSENT_CHANGED_EVENT,
  getConsentStatus,
  setConsentStatus,
  type ConsentStatus,
} from '@/lib/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const status = getConsentStatus();
    if (status === 'accepted') {
      enableAnalytics();
      return undefined;
    }
    if (status === null) {
      setVisible(true);
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
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged);
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
      role="dialog"
      aria-label="Consentimento de cookies"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          id="cookie-consent-description"
          className="text-sm text-neutral-600 dark:text-neutral-400"
        >
          Utilizamos cookies de análise (Vercel Analytics e Google Analytics) para entender como o
          site é usado e melhorar a experiência. Nenhum dado é coletado sem o seu consentimento.{' '}
          <a
            href="/privacidade/"
            className="font-medium text-emerald-600 underline underline-offset-2 transition-colors duration-150 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Política de Privacidade
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors duration-150 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
