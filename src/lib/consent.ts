export type ConsentStatus = 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';
export const CONSENT_CHANGED_EVENT = 'consent-changed';

export function getConsentStatus(): ConsentStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'accepted' || raw === 'rejected') return raw;
    return null;
  } catch {
    return null;
  }
}

export function setConsentStatus(status: ConsentStatus): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, status);
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: status }));
  } catch {
    // localStorage bloqueado — consentimento não persiste
  }
}

export function clearConsentStatus(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }));
  } catch {
    // localStorage bloqueado
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsentStatus() === 'accepted';
}
