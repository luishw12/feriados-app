import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ScrollArea from '@/components/ui/ScrollArea';
import { loadMunicipalityIndex } from '@/lib/municipality-index';
import {
  searchMunicipalities,
  type MunicipalityOption,
  type StateOption,
} from '@/lib/municipality-search';
import type { LocationContext } from '@/lib/location-storage';

interface Props {
  states: StateOption[];
  location: LocationContext | null;
  onSelect: (context: LocationContext | null) => void;
}

function formatOptionLabel(municipality: MunicipalityOption): string {
  return `${municipality.name}, ${municipality.uf}`;
}

export default function LocationCombobox({ states, location, onSelect }: Props) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMunicipalityIndex()
      .then((index) => {
        if (!cancelled) {
          setMunicipalities(index);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Não foi possível carregar a lista de cidades.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchResult = useMemo(
    () => searchMunicipalities(query, municipalities, states),
    [query, municipalities, states],
  );

  const options = searchResult.items;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, options.length]);

  useEffect(() => {
    if (location?.cityName && location.citySlug) {
      setQuery(formatOptionLabel({
        slug: location.citySlug,
        name: location.cityName,
        uf: location.uf,
      }));
      return;
    }
    if (location) {
      const state = states.find((entry) => entry.uf === location.uf);
      setQuery(state?.name ?? location.uf);
      return;
    }
    setQuery('');
  }, [location, states]);

  function selectMunicipality(municipality: MunicipalityOption) {
    const state = states.find((entry) => entry.uf === municipality.uf);
    if (!state) return;

    onSelect({
      uf: state.uf,
      stateName: state.name,
      stateSlug: state.slug,
      citySlug: municipality.slug,
      cityName: municipality.name,
    });
    setQuery(formatOptionLabel(municipality));
    setOpen(false);
  }

  function selectBrazil() {
    onSelect(null);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, options.length));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (activeIndex === 0) {
        selectBrazil();
        return;
      }
      const selected = options[activeIndex - 1];
      if (selected) selectMunicipality(selected);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs text-neutral-500">Cidade ou estado</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar cidade ou estado..."
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          disabled={loading}
          className="w-full rounded-lg border bg-white px-2.5 py-1.5 pr-8 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
        )}
      </div>

      {loadError && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{loadError}</p>}

      {open && !loading && !loadError && (
        <ScrollArea
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 rounded-xl border bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <button
            id={`${listboxId}-option-0`}
            type="button"
            role="option"
            aria-selected={activeIndex === 0}
            onMouseDown={(event) => event.preventDefault()}
            onClick={selectBrazil}
            className={[
              'block w-full px-3 py-2 text-left text-sm transition-colors duration-150',
              activeIndex === 0
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800',
            ].join(' ')}
          >
            Todo o Brasil
          </button>

          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-500">Nenhuma cidade encontrada.</p>
          )}

          {options.map((municipality, index) => {
            const optionIndex = index + 1;
            return (
              <button
                key={`${municipality.uf}/${municipality.slug}`}
                id={`${listboxId}-option-${optionIndex}`}
                type="button"
                role="option"
                aria-selected={activeIndex === optionIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMunicipality(municipality)}
                className={[
                  'block w-full px-3 py-2 text-left text-sm transition-colors duration-150',
                  activeIndex === optionIndex
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800',
                ].join(' ')}
              >
                {formatOptionLabel(municipality)}
              </button>
            );
          })}

          {searchResult.truncated && (
            <p className="border-t border-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800">
              Mostrando {options.length} resultados. Refine a busca para ver mais.
            </p>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
