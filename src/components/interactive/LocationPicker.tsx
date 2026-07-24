import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import LocationCombobox from '@/components/interactive/LocationCombobox';
import { detectUserLocation } from '@/lib/geolocation';
import { findMunicipalityByName } from '@/lib/municipality-match';
import { loadMunicipalityIndex } from '@/lib/municipality-index';
import type { MunicipalityOption, StateOption } from '@/lib/municipality-search';
import {
  clearLocationAutoAsked,
  clearLocationPromptDismissed,
  clearStoredLocation,
  getLocationLabel,
  hasLocationMismatch,
  loadBrowserLocation,
  saveDetectedLocations,
  saveStoredLocation,
  subscribeLocationUpdated,
  type LocationContext,
} from '@/lib/location-storage';

interface Props {
  states: StateOption[];
  location: LocationContext | null;
  onLocationChange: (location: LocationContext | null) => void;
  variant?: 'default' | 'header';
}

export type { LocationContext };

function useLocationMismatch(): boolean {
  return useSyncExternalStore(
    subscribeLocationUpdated,
    hasLocationMismatch,
    () => false,
  );
}

function useBrowserLocationLabel(): string | null {
  return useSyncExternalStore(
    subscribeLocationUpdated,
    () => {
      const browser = loadBrowserLocation();
      return browser ? getLocationLabel(browser) : null;
    },
    () => null,
  );
}

export default function LocationPicker({
  states,
  location,
  onLocationChange,
  variant = 'default',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mismatched = useLocationMismatch();
  const browserLabel = useBrowserLocationLabel();

  const locationLabel = getLocationLabel(location);

  function applyContext(context: LocationContext | null) {
    onLocationChange(context);
    if (context) {
      // Troca manual: atualiza só o cache do site (navegador permanece).
      saveStoredLocation(context, getLocationLabel(context));
      return;
    }
    clearStoredLocation();
    clearLocationPromptDismissed();
    clearLocationAutoAsked();
  }

  async function applyDetectionResult(
    uf: string,
    stateName: string,
    stateSlug: string,
    detectedCityName?: string,
  ) {
    let municipalities: MunicipalityOption[] = [];
    try {
      municipalities = await loadMunicipalityIndex();
    } catch {
      setDetectError('Não foi possível carregar a lista de cidades.');
      return;
    }

    const city = detectedCityName
      ? findMunicipalityByName(detectedCityName, uf, municipalities)
      : undefined;

    const context: LocationContext = {
      uf,
      stateName,
      stateSlug,
    };

    if (city) {
      context.citySlug = city.slug;
      context.cityName = city.name;
    }

    onLocationChange(context);
    saveDetectedLocations(context, getLocationLabel(context));
  }

  async function handleDetectLocation() {
    setLoading(true);
    setDetectError(null);

    const result = await detectUserLocation();

    if (!result) {
      setDetectError('Permissão negada ou localização indisponível. Selecione manualmente.');
      setLoading(false);
      return;
    }

    await applyDetectionResult(result.uf, result.stateName, result.stateSlug, result.cityName);
    setLoading(false);
    setOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          variant === 'header'
            ? [
                'inline-flex min-w-0 items-center gap-1 rounded-lg p-2 text-sm font-medium transition-colors duration-150 md:max-w-[9rem] md:px-2 md:py-1.5 md:text-xs',
                open
                  ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                  : mismatched
                    ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
              ].join(' ')
            : [
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-colors duration-150',
                mismatched
                  ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
              ].join(' ')
        }
        aria-label={
          mismatched
            ? `Alterar localização (diferente do navegador: ${browserLabel ?? 'desconhecida'})`
            : 'Alterar localização'
        }
        aria-expanded={open}
        title={
          mismatched && browserLabel
            ? `Localização do site diferente do navegador (${browserLabel})`
            : locationLabel
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin md:h-3.5 md:w-3.5" />
        ) : (
          <span className="relative shrink-0">
            <MapPin className="h-4 w-4 md:h-3.5 md:w-3.5" />
            {mismatched && (
              <span
                className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-1 ring-white dark:ring-neutral-900"
                aria-hidden="true"
              />
            )}
          </span>
        )}
        <span className="hidden truncate md:inline" suppressHydrationWarning>
          {locationLabel}
        </span>
        <ChevronDown className="hidden h-3 w-3 shrink-0 opacity-60 md:inline" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {mismatched && browserLabel && (
            <p className="mb-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              Navegador: {browserLabel}. O site está em outra localidade.
            </p>
          )}

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={loading}
            className="mb-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-left text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Detectando...' : 'Usar minha localização'}
          </button>

          {detectError && (
            <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">{detectError}</p>
          )}

          <LocationCombobox
            states={states}
            location={location}
            onSelect={applyContext}
          />
        </div>
      )}
    </div>
  );
}
