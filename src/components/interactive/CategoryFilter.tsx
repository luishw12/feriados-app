import { useEffect, useRef, useState } from 'react';
import type { HolidayCategory } from '@/data/schema';
import {
  HOLIDAY_CATEGORY_CHIP_COLORS,
  HOLIDAY_CATEGORY_LABELS,
  HOLIDAY_CATEGORY_ORDER,
} from '@/lib/constants';
import { SlidersHorizontal, X } from 'lucide-react';

interface Props {
  selected: ReadonlySet<HolidayCategory>;
  onChange: (selected: Set<HolidayCategory>) => void;
}

export default function CategoryFilter({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (category: HolidayCategory) => {
    const next = new Set(selected);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(HOLIDAY_CATEGORY_ORDER));
  };

  const clearAll = () => {
    onChange(new Set());
  };

  const allSelected = HOLIDAY_CATEGORY_ORDER.every((category) => selected.has(category));
  const activeCount = selected.size;
  const hasPartialSelection = activeCount > 0 && activeCount < HOLIDAY_CATEGORY_ORDER.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'inline-flex items-center gap-1.5 rounded-lg p-1.5 text-neutral-400 transition-colors duration-150',
          open || hasPartialSelection
            ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
            : 'hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300',
        ].join(' ')}
        aria-label="Filtrar feriados por tema"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" />
        {hasPartialSelection && (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-950/20 sm:hidden dark:bg-neutral-950/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            className={[
              'z-50 rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900',
              'fixed bottom-20 left-4 right-4 p-4',
              'sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:p-4',
            ].join(' ')}
            role="dialog"
            aria-label="Filtrar feriados por tema"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Temas
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                aria-label="Fechar filtros de tema"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={allSelected}
                className="text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Selecionar todos
              </button>
              <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={clearAll}
                disabled={selected.size === 0}
                className="text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Limpar
              </button>
            </div>

            <div
              role="group"
              aria-label="Filtrar feriados por tema"
              className="flex flex-wrap gap-1.5"
            >
              {HOLIDAY_CATEGORY_ORDER.map((category) => {
                const isSelected = selected.has(category);
                const colors = HOLIDAY_CATEGORY_CHIP_COLORS[category];
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleCategory(category)}
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-all duration-200',
                      isSelected
                        ? colors.selected
                        : `${colors.unselected} opacity-70 hover:opacity-100`,
                    ].join(' ')}
                  >
                    {HOLIDAY_CATEGORY_LABELS[category]}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
