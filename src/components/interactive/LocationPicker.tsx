import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import LocationCombobox from '@/components/interactive/LocationCombobox';
import { detectUserLocation } from '@/lib/geolocation';
import { findMunicipalityByName } from '@/lib/municipality-match';
import { loadMunicipalityIndex } from '@/lib/municipality-index';
import type { MunicipalityOption, StateOption } from '@/lib/municipality-search';
import {
  clearLocationPromptDismissed,
  clearStoredLocation,
  getLocationLabel,
  saveStoredLocation,
  type LocationContext,
} from '@/lib/location-storage';

interface Props {
  states: StateOption[];
  location: LocationContext | null;
  onLocationChange: (location: LocationContext | null) => void;
  variant?: 'default' | 'header';
}

export type { LocationContext };

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

  const locationLabel = getLocationLabel(location);

  function applyContext(context: LocationContext | null) {
    onLocationChange(context);
    if (context) {
      saveStoredLocation(context, getLocationLabel(context));
      return;
    }
    clearStoredLocation();
    clearLocationPromptDismissed();
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

    applyContext(context);
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
                'inline-flex max-w-[6.5rem] min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors duration-150 sm:max-w-[8.5rem] sm:text-sm',
                open
                  ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
              ].join(' ')
            : 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
        }
        aria-label="Alterar localização"
        aria-expanded={open}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <MapPin className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{locationLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
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
