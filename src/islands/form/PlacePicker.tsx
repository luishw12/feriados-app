import { useEffect, useRef, useState } from 'preact/hooks';
import { loadIndex, placeKey, placeText, searchPlaces, type Place, type PlaceKind, type SearchIndex } from '../search-core';

/**
 * Campo de busca de lugar (Nacional, estado ou cidade) no padrão combobox.
 * Depois de escolhido, vira um chip com o botão "Trocar". Usa o mesmo índice
 * da busca do site, baixado só quando o campo recebe foco.
 */
interface Props {
  value: Place | null;
  onChange: (place: Place | null) => void;
  allow: readonly PlaceKind[];
  id: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  placeholder?: string;
  /** Texto inicial da busca (ex.: lugar digitado numa sugestão antiga). */
  initialQuery?: string;
  /** Mostra "Não achei meu lugar" no fim da lista. */
  onNotFound?: () => void;
}

const TONE: Record<PlaceKind, string> = { national: 'tone-national', state: 'tone-state', city: 'tone-municipal' };
const KIND_TEXT: Record<PlaceKind, string> = { national: 'Nacional', state: 'Estado', city: 'Cidade' };

export default function PlacePicker({ value, onChange, allow, id, invalid, describedBy, placeholder, initialQuery = '', onNotFound }: Props) {
  const [editing, setEditing] = useState(!value);
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const listId = `${id}-list`;

  useEffect(() => setEditing(!value), [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (root.current && event.target instanceof Node && !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function load() {
    setOpen(true);
    if (index) return;
    loadIndex()
      .then((i) => {
        setIndex(i);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }

  const results = index ? searchPlaces(index, query, allow, 8) : [];

  function choose(place: Place) {
    onChange(place);
    setQuery('');
    setOpen(false);
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) load();
      setActive(Math.min(active + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(Math.max(active - 1, 0));
    } else if (event.key === 'Enter' && open && results[active]) {
      event.preventDefault();
      choose(results[active]!);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  if (value && !editing) {
    return (
      <div class="flex min-h-11 items-center gap-3 rounded-xl border border-line-strong bg-surface py-1.5 pr-1.5 pl-3 shadow-[var(--shadow-card)]">
        <span class={`chip tone-badge ${TONE[value.kind]}`}>{KIND_TEXT[value.kind]}</span>
        <span class="min-w-0 flex-1 truncate text-sm font-medium" id={`${id}-value`}>
          {placeText(value)}
        </span>
        <button
          type="button"
          class="btn px-3 py-1 text-xs"
          aria-describedby={`${id}-value`}
          onClick={() => {
            setEditing(true);
            requestAnimationFrame(() => input.current?.focus());
          }}
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div ref={root} class="relative">
      <div class="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          id={id}
          class="input pl-10"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autocomplete="off"
          placeholder={placeholder ?? 'Digite a cidade ou o estado'}
          value={query}
          onFocus={load}
          onInput={(e) => {
            setQuery(e.currentTarget.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKey}
        />
      </div>
      {value && (
        <button type="button" class="mt-1.5 text-xs text-faint underline hover:text-fg" onClick={() => setEditing(false)}>
          Manter {placeText(value)}
        </button>
      )}
      {open && (
        <ul id={listId} role="listbox" aria-label="Lugares" class="popover inset-x-0 max-h-72 overflow-y-auto">
          {failed && <li class="px-3 py-4 text-center text-sm text-muted">Não foi possível carregar a lista. Verifique sua conexão.</li>}
          {!failed && !index && <li class="px-3 py-4 text-center text-sm text-muted">Carregando…</li>}
          {index && results.length === 0 && <li class="px-3 py-4 text-center text-sm text-muted">Nada encontrado para “{query}”.</li>}
          {results.map((place, i) => (
            <li
              key={placeKey(place)}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              class={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${i === active ? 'bg-subtle' : ''}`}
              onPointerDown={(e) => e.preventDefault()}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(place)}
            >
              <span class="truncate font-medium">{placeText(place)}</span>
              <span class={`chip tone-badge ${TONE[place.kind]}`}>{KIND_TEXT[place.kind]}</span>
            </li>
          ))}
          {onNotFound && index && (
            <li class="mt-1 border-t border-line pt-1">
              <button
                type="button"
                class="w-full rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-subtle hover:text-fg"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  onNotFound();
                }}
              >
                Não achei o lugar — escrever à mão
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
