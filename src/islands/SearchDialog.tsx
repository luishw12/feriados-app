import { useEffect, useRef, useState } from 'preact/hooks';
import { loadIndex, resultHref, search, type SearchIndex, type SearchResult } from './search-core';

/**
 * Busca global (Ctrl/⌘+K ou "/"). Abre a partir de qualquer elemento com
 * `data-open-search`; o índice (~60 KB gzip) só é baixado na primeira abertura.
 */
export default function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results: SearchResult[] = index ? search(index, query) : [];

  function open() {
    dialog.current?.showModal();
    input.current?.focus();
    loadIndex()
      .then(setIndex)
      .catch(() => setError(true));
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('[data-open-search]') : null;
      if (!target) return;
      event.preventDefault();
      open();
    };
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName));
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        open();
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    // pré-carrega o índice quando o usuário demonstra intenção
    const warm = () => void loadIndex().catch(() => undefined);
    document.querySelectorAll('[data-open-search]').forEach((el) => el.addEventListener('pointerenter', warm, { once: true }));
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === 'Enter') {
      const result = results[active];
      if (result) window.location.href = resultHref(result);
      else if (query.trim()) window.location.href = `/busca/?q=${encodeURIComponent(query.trim())}`;
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-label="Buscar"
      class="m-0 mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
    >
      <div class="flex items-center gap-3 border-b border-line px-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-faint" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          type="text"
          enterKeyHint="search"
          value={query}
          onInput={(e) => {
            setQuery(e.currentTarget.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Cidade, estado ou feriado… (ex.: Campinas, Carnaval)"
          class="h-14 w-full bg-transparent text-base outline-none placeholder:text-faint"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${active}` : undefined}
          autocomplete="off"
          spellcheck={false}
        />
        <button type="button" class="rounded border border-line px-1.5 font-mono text-xs text-faint" onClick={() => dialog.current?.close()}>
          esc
        </button>
      </div>
      <ul id="search-results" role="listbox" class="max-h-[60vh] overflow-y-auto p-2">
        {error && <li class="px-3 py-6 text-center text-sm text-muted">Não foi possível carregar a busca. Verifique sua conexão.</li>}
        {!error && !index && query && <li class="px-3 py-6 text-center text-sm text-muted">Carregando…</li>}
        {index && query && results.length === 0 && <li class="px-3 py-6 text-center text-sm text-muted">Nada encontrado para “{query}”.</li>}
        {!query && <li class="px-3 py-6 text-center text-sm text-faint">Digite o nome de uma cidade, de um estado ou de um feriado.</li>}
        {results.map((r, i) => (
          <li key={`${r.type}-${i}`} id={`sr-${i}`} role="option" aria-selected={i === active}>
            <a
              href={resultHref(r)}
              class={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${i === active ? 'bg-subtle' : ''}`}
              onMouseEnter={() => setActive(i)}
            >
              <span class="truncate font-medium">
                {r.type === 'city' ? r.item.name : r.item.name}
                {r.type === 'city' && <span class="text-faint font-normal"> · {r.item.uf}</span>}
              </span>
              <span class="text-xs text-faint">
                {r.type === 'city' ? (r.item.capital ? 'Capital' : 'Cidade') : r.type === 'state' ? 'Estado' : r.item.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
