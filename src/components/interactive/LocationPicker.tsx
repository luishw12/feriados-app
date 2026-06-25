import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import { detectUserLocation } from '@/lib/geolocation';
import { findMunicipalityByName } from '@/lib/municipality-match';
import {
  clearLocationPromptDismissed,
  clearStoredLocation,
  getLocationLabel,
  saveStoredLocation,
  type LocationContext,
} from '@/lib/location-storage';

interface MunicipalityOption {
  slug: string;
  name: string;
  uf: string;
}

interface StateOption {
  uf: string;
  name: string;
  slug: string;
}

interface Props {
  states: StateOption[];
  municipalities: MunicipalityOption[];
  location: LocationContext | null;
  onLocationChange: (location: LocationContext | null) => void;
  variant?: 'default' | 'header';
}

export type { LocationContext };

export default function LocationPicker({
  states,
  municipalities,
  location,
  onLocationChange,
  variant = 'default',
}: Props) {
  const [selectedUf, setSelectedUf] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const citiesForState = municipalities.filter((m) => m.uf === selectedUf);
  const locationLabel = getLocationLabel(location);

  useEffect(() => {
    if (location) {
      setSelectedUf(location.uf);
      setSelectedCity(location.citySlug ?? '');
      return;
    }
    setSelectedUf('');
    setSelectedCity('');
  }, [location]);

  function applyContext(context: LocationContext) {
    onLocationChange(context);
    saveStoredLocation(context, getLocationLabel(context));
  }

  function clearLocation() {
    onLocationChange(null);
    clearStoredLocation();
    clearLocationPromptDismissed();
  }

  function applyManualSelection(uf: string, citySlug?: string) {
    setDetectError(null);
    if (!uf) {
      clearLocation();
      return;
    }

    const state = states.find((s) => s.uf === uf);
    if (!state) return;

    const city = citySlug ? municipalities.find((m) => m.slug === citySlug && m.uf === uf) : undefined;

    const context: LocationContext = {
      uf: state.uf,
      stateName: state.name,
      stateSlug: state.slug,
    };

    if (city) {
      context.citySlug = city.slug;
      context.cityName = city.name;
    }

    applyContext(context);
  }

  function applyDetectionResult(
    uf: string,
    stateName: string,
    stateSlug: string,
    detectedCityName?: string,
  ) {
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

    setSelectedUf(uf);
    setSelectedCity(city?.slug ?? '');
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

    applyDetectionResult(result.uf, result.stateName, result.stateSlug, result.cityName);
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
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={loading}
            className="mb-2 w-full rounded-lg bg-emerald-600 px-3 py-2 text-left text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Detectando...' : 'Usar minha localização'}
          </button>

          {detectError && (
            <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">{detectError}</p>
          )}

          <label className="mb-2 block space-y-1 text-sm">
            <span className="text-neutral-500">Estado</span>
            <select
              value={selectedUf}
              onChange={(e) => {
                const uf = e.target.value;
                setSelectedUf(uf);
                setSelectedCity('');
                applyManualSelection(uf);
              }}
              className="w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">Todo o Brasil</option>
              {states.map((state) => (
                <option key={state.uf} value={state.uf}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-neutral-500">Cidade</span>
            <select
              value={selectedCity}
              disabled={!selectedUf}
              onChange={(e) => {
                const citySlug = e.target.value;
                setSelectedCity(citySlug);
                applyManualSelection(selectedUf, citySlug || undefined);
              }}
              className="w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">—</option>
              {citiesForState.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
