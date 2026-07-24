import { initThemePersistence } from '@/lib/theme-storage';

const LOCATION_STORAGE_KEY = 'feriados-location';

let viewTransitionBootstrapInitialized = false;

function bootstrapLocation(): void {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (raw) {
      window.__FERIADOS_BOOTSTRAP_LOCATION__ = raw;
      return;
    }
    delete window.__FERIADOS_BOOTSTRAP_LOCATION__;
  } catch {
    delete window.__FERIADOS_BOOTSTRAP_LOCATION__;
  }
}

export function initViewTransitionBootstrap(): void {
  if (typeof document === 'undefined' || viewTransitionBootstrapInitialized) return;
  viewTransitionBootstrapInitialized = true;

  initThemePersistence();
  bootstrapLocation();

  document.addEventListener('astro:page-load', bootstrapLocation);
  document.addEventListener('astro:after-swap', bootstrapLocation);
}
