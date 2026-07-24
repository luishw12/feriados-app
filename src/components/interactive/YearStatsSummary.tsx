import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { YearHolidayStats } from '@/lib/holiday-stats';

interface Props {
  stats: YearHolidayStats;
  year: number;
}

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 bg-white/60 px-2.5 py-1 text-xs dark:border-neutral-700/80 dark:bg-neutral-900/60">
      <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{value}</span>
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    </span>
  );
}

export default function YearStatsSummary({ stats, year }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { mandatory, optional } = stats;

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

  if (mandatory.total === 0 && optional.total === 0) return null;

  const chips: Array<{ value: number; label: string }> = [];

  if (mandatory.total > 0) {
    chips.push({
      value: mandatory.total,
      label: mandatory.total === 1 ? 'obrigatório' : 'obrigatórios',
    });
  }

  if (mandatory.weekday > 0) {
    chips.push({
      value: mandatory.weekday,
      label: mandatory.weekday === 1 ? 'dia útil' : 'dias úteis',
    });
  }

  if (optional.total > 0) {
    chips.push({
      value: optional.total,
      label: optional.total === 1 ? 'facultativo' : 'facultativos',
    });
  }

  const hasDetails = mandatory.bridge > 0 || mandatory.weekend > 0;

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.slice(0, 3).map((chip) => (
          <StatChip key={chip.label} value={chip.value} label={chip.label} />
        ))}

        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={[
              'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors duration-150',
              open
                ? 'border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200'
                : 'border-neutral-200/80 bg-white/60 text-neutral-500 hover:text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-400 dark:hover:text-neutral-200',
            ].join(' ')}
            aria-label={`Mais detalhes sobre feriados em ${year}`}
            aria-expanded={open}
          >
            <Info className="h-3 w-3" />
            <span className="hidden sm:inline">Detalhes</span>
          </button>
        )}
      </div>

      {open && hasDetails && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          role="dialog"
          aria-label={`Detalhes dos feriados em ${year}`}
        >
          <p className="mb-2 text-xs font-semibold text-neutral-900 dark:text-neutral-50">
            Resumo de {year}
          </p>
          <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            {mandatory.bridge > 0 && (
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {mandatory.bridge}
                </span>{' '}
                {mandatory.bridge === 1 ? 'cai em terça ou quinta' : 'caem em terça ou quinta'} —
                possível emenda
              </li>
            )}
            {mandatory.weekend > 0 && (
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {mandatory.weekend}
                </span>{' '}
                {mandatory.weekend === 1 ? 'no fim de semana' : 'no fim de semana'}
              </li>
            )}
            {mandatory.weekday > 0 && (
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {mandatory.weekday}
                </span>{' '}
                {mandatory.weekday === 1 ? 'afeta dia útil' : 'afetam dias úteis'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
