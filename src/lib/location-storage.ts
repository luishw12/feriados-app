const STORAGE_KEY = 'feriados-location';
const PROMPT_DISMISSED_KEY = 'feriados-location-prompt-dismissed';
export const LOCATION_UPDATED_EVENT = 'feriados-location-updated';

export interface StoredLocation {
  uf: string;
  stateName: string;
  stateSlug: string;
  citySlug?: string;
  cityName?: string;
  label: string;
}

export interface LocationContext {
  uf: string;
  stateName: string;
  stateSlug: string;
  citySlug?: string;
  cityName?: string;
}

export function loadStoredLocation(): StoredLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const bootstrapRaw = window.__FERIADOS_BOOTSTRAP_LOCATION__;
    if (bootstrapRaw !== undefined) {
      delete window.__FERIADOS_BOOTSTRAP_LOCATION__;
      return JSON.parse(bootstrapRaw) as StoredLocation;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLocation;
  } catch {
    return null;
  }
}

export function storedToContext(stored: StoredLocation): LocationContext {
  const context: LocationContext = {
    uf: stored.uf,
    stateName: stored.stateName,
    stateSlug: stored.stateSlug,
  };
  if (stored.citySlug !== undefined) context.citySlug = stored.citySlug;
  if (stored.cityName !== undefined) context.cityName = stored.cityName;
  return context;
}

export function loadStoredLocationContext(): LocationContext | null {
  const stored = loadStoredLocation();
  return stored ? storedToContext(stored) : null;
}

export function buildStoredLocation(context: LocationContext, label: string): StoredLocation {
  const stored: StoredLocation = {
    uf: context.uf,
    stateName: context.stateName,
    stateSlug: context.stateSlug,
    label,
  };
  if (context.citySlug !== undefined) stored.citySlug = context.citySlug;
  if (context.cityName !== undefined) stored.cityName = context.cityName;
  return stored;
}

export function saveStoredLocation(context: LocationContext, label: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildStoredLocation(context, label)));
  dispatchLocationUpdated();
}

export function clearStoredLocation(): void {
  localStorage.removeItem(STORAGE_KEY);
  dispatchLocationUpdated();
}

export function getLocationLabel(context: LocationContext | null): string {
  if (!context) return 'Brasil';
  if (context.cityName) return `${context.cityName}, ${context.uf}`;
  return context.uf;
}

export function isLocationPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true';
}

export function dismissLocationPrompt(): void {
  localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
  dispatchLocationUpdated();
}

export function clearLocationPromptDismissed(): void {
  localStorage.removeItem(PROMPT_DISMISSED_KEY);
}

export function dispatchLocationUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOCATION_UPDATED_EVENT));
}

export function subscribeLocationUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(LOCATION_UPDATED_EVENT, callback);
  return () => window.removeEventListener(LOCATION_UPDATED_EVENT, callback);
}
