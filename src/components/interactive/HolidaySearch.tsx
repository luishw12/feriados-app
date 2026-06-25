import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Search, X } from 'lucide-react';
import type { HolidayType } from '@/data/schema';
import { HOLIDAY_TYPE_COLORS, getHolidayBadgeLabel } from '@/lib/constants';
import {
  searchHolidays,
  truncateSnippet,
  type SearchIndexEntry,
} from '@/lib/search';

const LIST_ID = 'holiday-search-results';
const SEARCH_INDEX_URL = '/search-index.json/';
const DEBOUNCE_MS = 200;

const HOLIDAY_TYPES: HolidayType[] = [
  'national',
  'state',
  'municipal',
  'optional',
  'state_optional',
  'commemorative',
];

function isHolidayType(value: unknown): value is HolidayType {
  return typeof value === 'string' && HOLIDAY_TYPES.includes(value as HolidayType);
}

function isSearchIndexEntry(value: unknown): value is SearchIndexEntry {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    isHolidayType(record.type) &&
    typeof record.dayNum === 'number' &&
    typeof record.weekdayShort === 'string' &&
    typeof record.scopeLabel === 'string' &&
    typeof record.snippet === 'string' &&
    typeof record.searchText === 'string'
  );
}

function parseSearchIndex(data: unknown): SearchIndexEntry[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isSearchIndexEntry);
}

export default function HolidaySearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);
  const indexRef = useRef<SearchIndexEntry[] | null>(null);
  const searchGenerationRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();

  const loadIndex = useCallback(async (): Promise<SearchIndexEntry[]> => {
    if (indexRef.current) return indexRef.current;

    setIndexLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(SEARCH_INDEX_URL);
      if (!response.ok) {
        throw new Error(`Falha ao carregar índice (${response.status})`);
      }
      const data = parseSearchIndex(await response.json());
      if (data.length === 0) {
        throw new Error('Índice de busca vazio');
      }
      indexRef.current = data;
      return data;
    } catch {
      setLoadError('Não foi possível carregar a busca. Tente novamente.');
      return [];
    } finally {
      setIndexLoading(false);
    }
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const generation = searchGenerationRef.current + 1;
      searchGenerationRef.current = generation;
      setSearching(true);

      const index = await loadIndex();
      const normalized = searchQuery.trim();

      if (searchGenerationRef.current !== generation) return;

      if (!normalized || index.length === 0) {
        setResults([]);
        setActiveIndex(-1);
        setSearching(false);
        return;
      }

      setResults(searchHolidays(index, normalized));
      setActiveIndex(-1);
      setSearching(false);
    },
    [loadIndex],
  );

  const closePalette = useCallback(() => {
    searchGenerationRef.current += 1;
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    setLoadError(null);
    setSearching(false);
  }, []);

  const clearQuery = useCallback(() => {
    searchGenerationRef.current += 1;
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    setSearching(false);
    inputRef.current?.focus();
  }, []);

  const openPalette = useCallback(
    (initialQuery = '') => {
      setOpen(true);
      if (initialQuery) {
        setQuery(initialQuery);
        void runSearch(initialQuery);
      }
      void loadIndex();
      window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [loadIndex, runSearch],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (trimmedQuery) {
        void runSearch(trimmedQuery);
      } else {
        searchGenerationRef.current += 1;
        setResults([]);
        setActiveIndex(-1);
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [trimmedQuery, runSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) {
      openPalette(initialQuery);
    }
  }, [openPalette]);

  useEffect(() => {
    function handleGlobalShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    }

    document.addEventListener('keydown', handleGlobalShortcut);
    return () => document.removeEventListener('keydown', handleGlobalShortcut);
  }, [open, closePalette, openPalette]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closePalette();
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closePalette]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current < results.length - 1 ? current + 1 : 0));
      return;
    }

    if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current > 0 ? current - 1 : results.length - 1));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      window.location.href = `/feriado/${results[activeIndex].id}/`;
    }
  }

  const showEmptyHint = !loadError && !indexLoading && !searching && trimmedQuery.length === 0;
  const showNoResults =
    !loadError && !indexLoading && !searching && trimmedQuery.length > 0 && results.length === 0;
  const showLoading = !loadError && (indexLoading || searching) && results.length === 0;

  const paletteContent = (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm dark:bg-neutral-950/70"
        aria-label="Fechar busca"
        onClick={closePalette}
      />

      <div
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="holiday-search-title"
      >
        <h2 id="holiday-search-title" className="sr-only">
          Buscar feriado
        </h2>

        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar feriado por nome ou conteúdo..."
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-label="Buscar feriado"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={clearQuery}
              className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {(indexLoading || searching) && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-400" aria-hidden="true" />
          )}
        </div>

        <div className="max-h-[min(50vh,22rem)] overflow-y-auto p-2">
          {loadError && (
            <p className="px-3 py-6 text-center text-sm text-amber-600 dark:text-amber-400">
              {loadError}
            </p>
          )}

          {showLoading && (
            <p className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {indexLoading ? 'Carregando busca...' : 'Buscando...'}
            </p>
          )}

          {showEmptyHint && (
            <p className="px-3 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Digite o nome do feriado ou um termo do artigo.
            </p>
          )}

          {showNoResults && (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              Nenhum feriado encontrado.
            </p>
          )}

          {results.length > 0 && (
            <ul id={LIST_ID} role="listbox" className="space-y-1.5 px-1 pb-1">
              {results.map((entry, index) => {
                const isActive = index === activeIndex;
                const colors = HOLIDAY_TYPE_COLORS[entry.type];

                return (
                  <li key={entry.id} role="option" aria-selected={isActive}>
                    <a
                      ref={isActive ? activeItemRef : undefined}
                      href={`/feriado/${entry.id}/`}
                      className={[
                        'flex gap-2.5 rounded-xl border p-2.5 transition-colors duration-150',
                        isActive
                          ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30'
                          : 'border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20',
                      ].join(' ')}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <div
                        className={[
                          'flex w-9 shrink-0 flex-col items-center justify-center rounded-lg py-1',
                          colors.bg,
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'text-base font-semibold tabular-nums leading-none',
                            colors.text,
                          ].join(' ')}
                        >
                          {entry.dayNum}
                        </span>
                        <span className="mt-0.5 text-[9px] uppercase text-neutral-500 dark:text-neutral-400">
                          {entry.weekdayShort.replace('.', '')}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-50">
                          {entry.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                              colors.bg,
                              colors.text,
                            ].join(' ')}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                            {getHolidayBadgeLabel(entry.type)}
                          </span>
                          <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">
                            {entry.scopeLabel}
                          </span>
                        </div>
                        {entry.snippet && (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {truncateSnippet(entry.snippet, 120)}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-2.5 text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
          <span>
            <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-sans dark:border-neutral-700 dark:bg-neutral-800">
              ↑↓
            </kbd>{' '}
            navegar
          </span>
          <span>
            <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-sans dark:border-neutral-700 dark:bg-neutral-800">
              Enter
            </kbd>{' '}
            abrir
          </span>
          <span>
            <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-sans dark:border-neutral-700 dark:bg-neutral-800">
              Esc
            </kbd>{' '}
            fechar
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => openPalette()}
        className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        aria-label="Buscar feriado"
        title="Buscar feriado (Ctrl+K)"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(paletteContent, document.body)}
    </>
  );
}
