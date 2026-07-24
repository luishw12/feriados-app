const STORAGE_KEY = 'theme';

export const THEME_UPDATED_EVENT = 'feriados-theme-updated';

export type ThemePreference = 'light' | 'dark';

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getStoredThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return null;
  } catch {
    return null;
  }
}

export function resolveIsDark(): boolean {
  const stored = getStoredThemePreference();
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return getSystemPrefersDark();
}

export function applyThemeToDocument(doc: Document = document): void {
  doc.documentElement.classList.toggle('dark', resolveIsDark());
}

export function setStoredThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage bloqueado — preferência não persiste
  }

  applyThemeToDocument();
  dispatchThemeUpdated();
}

export function toggleStoredTheme(): ThemePreference {
  const next: ThemePreference = resolveIsDark() ? 'light' : 'dark';
  setStoredThemePreference(next);
  return next;
}

export function getThemeSnapshot(): boolean {
  return resolveIsDark();
}

export function dispatchThemeUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(THEME_UPDATED_EVENT));
}

export function subscribeThemeUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = () => callback();

  window.addEventListener(THEME_UPDATED_EVENT, handler);
  document.addEventListener('astro:page-load', handler);
  document.addEventListener('astro:after-swap', handler);

  return () => {
    window.removeEventListener(THEME_UPDATED_EVENT, handler);
    document.removeEventListener('astro:page-load', handler);
    document.removeEventListener('astro:after-swap', handler);
  };
}

let themePersistenceInitialized = false;

export function initThemePersistence(): void {
  if (typeof document === 'undefined' || themePersistenceInitialized) return;
  themePersistenceInitialized = true;

  applyThemeToDocument();

  document.addEventListener('astro:before-swap', (event) => {
    const swapEvent = event as Event & { newDocument: Document };
    applyThemeToDocument(swapEvent.newDocument);
  });

  document.addEventListener('astro:after-swap', () => {
    applyThemeToDocument();
    dispatchThemeUpdated();
  });

  document.addEventListener('astro:page-load', () => {
    applyThemeToDocument();
    dispatchThemeUpdated();
  });
}
