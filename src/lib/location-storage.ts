const STORAGE_KEY = 'feriados-location';
const BROWSER_LOCATION_KEY = 'feriados-browser-location';
const PROMPT_DISMISSED_KEY = 'feriados-location-prompt-dismissed';
const AUTO_ASKED_KEY = 'feriados-location-auto-asked';
const MISMATCH_DISMISSED_KEY = 'feriados-location-mismatch-dismissed';
export const LOCATION_UPDATED_EVENT = 'feriados-location-updated';

/** Cache da geolocalização do navegador — evita GPS/reverse-geocode a cada reload. */
const BROWSER_LOCATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

export interface StoredBrowserLocation extends LocationContext {
  detectedAt: number;
}

/** Snapshot cache for useSyncExternalStore — getSnapshot must return stable refs. */
let cachedRaw: string | null | undefined;
let cachedContext: LocationContext | null | undefined;

function readRawLocation(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const bootstrapRaw = window.__FERIADOS_BOOTSTRAP_LOCATION__;
    if (typeof bootstrapRaw === 'string') return bootstrapRaw;
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearBootstrapLocation(): void {
  if (typeof window === 'undefined') return;
  delete window.__FERIADOS_BOOTSTRAP_LOCATION__;
}

function setCachedFromRaw(raw: string | null): LocationContext | null {
  cachedRaw = raw;
  if (!raw) {
    cachedContext = null;
    return null;
  }

  try {
    cachedContext = storedToContext(JSON.parse(raw) as StoredLocation);
  } catch {
    cachedContext = null;
  }
  return cachedContext ?? null;
}

export function loadStoredLocation(): StoredLocation | null {
  const raw = readRawLocation();
  if (!raw) return null;
  try {
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

/**
 * Pure getSnapshot for useSyncExternalStore.
 * Returns the same object reference while the stored JSON is unchanged.
 */
export function loadStoredLocationContext(): LocationContext | null {
  if (typeof window === 'undefined') return null;

  const raw = readRawLocation();
  if (cachedContext !== undefined && cachedRaw === raw) {
    return cachedContext;
  }

  return setCachedFromRaw(raw);
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
  const stored = buildStoredLocation(context, label);
  const raw = JSON.stringify(stored);
  localStorage.setItem(STORAGE_KEY, raw);
  clearBootstrapLocation();
  cachedRaw = raw;
  cachedContext = storedToContext(stored);
  dispatchLocationUpdated();
}

export function clearStoredLocation(): void {
  localStorage.removeItem(STORAGE_KEY);
  clearBootstrapLocation();
  cachedRaw = null;
  cachedContext = null;
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

export function isLocationAutoAsked(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTO_ASKED_KEY) === 'true';
}

export function markLocationAutoAsked(): void {
  localStorage.setItem(AUTO_ASKED_KEY, 'true');
}

export function clearLocationAutoAsked(): void {
  localStorage.removeItem(AUTO_ASKED_KEY);
}

export function locationsEqual(
  a: LocationContext | null | undefined,
  b: LocationContext | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.uf === b.uf && (a.citySlug ?? '') === (b.citySlug ?? '');
}

function mismatchFingerprint(site: LocationContext, browser: LocationContext): string {
  return `${site.uf}:${site.citySlug ?? ''}|${browser.uf}:${browser.citySlug ?? ''}`;
}

export function loadBrowserLocation(): LocationContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BROWSER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBrowserLocation;
    if (!parsed.uf || typeof parsed.detectedAt !== 'number') return null;
    if (Date.now() - parsed.detectedAt > BROWSER_LOCATION_TTL_MS) return null;

    const context: LocationContext = {
      uf: parsed.uf,
      stateName: parsed.stateName,
      stateSlug: parsed.stateSlug,
    };
    if (parsed.citySlug !== undefined) context.citySlug = parsed.citySlug;
    if (parsed.cityName !== undefined) context.cityName = parsed.cityName;
    return context;
  } catch {
    return null;
  }
}

export function saveBrowserLocation(context: LocationContext): void {
  const stored: StoredBrowserLocation = {
    ...context,
    detectedAt: Date.now(),
  };
  localStorage.setItem(BROWSER_LOCATION_KEY, JSON.stringify(stored));
  dispatchLocationUpdated();
}

export function clearBrowserLocation(): void {
  localStorage.removeItem(BROWSER_LOCATION_KEY);
  localStorage.removeItem(MISMATCH_DISMISSED_KEY);
  dispatchLocationUpdated();
}

/** Persiste a localização do site e a do navegador juntas (detecção GPS). */
export function saveDetectedLocations(context: LocationContext, label: string): void {
  const stored = buildStoredLocation(context, label);
  const raw = JSON.stringify(stored);
  localStorage.setItem(STORAGE_KEY, raw);
  clearBootstrapLocation();
  cachedRaw = raw;
  cachedContext = storedToContext(stored);

  const browserStored: StoredBrowserLocation = {
    ...context,
    detectedAt: Date.now(),
  };
  localStorage.setItem(BROWSER_LOCATION_KEY, JSON.stringify(browserStored));
  dispatchLocationUpdated();
}

export function hasLocationMismatch(): boolean {
  const site = loadStoredLocationContext();
  const browser = loadBrowserLocation();
  if (!site || !browser) return false;
  return !locationsEqual(site, browser);
}

export function isMismatchDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const site = loadStoredLocationContext();
  const browser = loadBrowserLocation();
  if (!site || !browser || locationsEqual(site, browser)) return true;
  try {
    return localStorage.getItem(MISMATCH_DISMISSED_KEY) === mismatchFingerprint(site, browser);
  } catch {
    return false;
  }
}

export function dismissLocationMismatch(): void {
  const site = loadStoredLocationContext();
  const browser = loadBrowserLocation();
  if (!site || !browser) return;
  localStorage.setItem(MISMATCH_DISMISSED_KEY, mismatchFingerprint(site, browser));
  dispatchLocationUpdated();
}

export function clearMismatchDismissed(): void {
  localStorage.removeItem(MISMATCH_DISMISSED_KEY);
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
