const STORAGE_KEY = 'feriados-location';

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
}

export function clearStoredLocation(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getLocationLabel(context: LocationContext | null): string {
  if (!context) return 'Brasil';
  if (context.cityName) return `${context.cityName}, ${context.uf}`;
  return context.uf;
}
