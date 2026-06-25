import type { HolidayCategory } from '@/data/schema';
import {
  HOLIDAY_CATEGORY_CHIP_COLORS,
  HOLIDAY_CATEGORY_LABELS,
  HOLIDAY_CATEGORY_ORDER,
} from '@/lib/constants';

interface Props {
  selected: ReadonlySet<HolidayCategory>;
  onChange: (selected: Set<HolidayCategory>) => void;
}

export default function CategoryFilter({ selected, onChange }: Props) {
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

  return (
    <div className="mb-3 shrink-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Temas</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className="text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Selecionar todos
          </button>
          <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={clearAll}
            disabled={selected.size === 0}
            className="text-xs text-neutral-500 transition-colors duration-150 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Limpar
          </button>
        </div>
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
                'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors duration-150',
                isSelected ? colors.selected : colors.unselected,
              ].join(' ')}
            >
              {HOLIDAY_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
