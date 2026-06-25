import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import type { YearHolidayStats } from '@/lib/holiday-stats';

interface Props {
  stats: YearHolidayStats;
  year: number;
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <span>
      <span className="font-medium tabular-nums text-neutral-700 dark:text-neutral-300">{value}</span>{' '}
      {label}
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

  return (
    <div className="relative mb-3 shrink-0" ref={panelRef}>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        {mandatory.total > 0 && (
          <>
            <StatItem
              value={mandatory.total}
              label={mandatory.total === 1 ? 'obrigatório' : 'obrigatórios'}
            />
            {mandatory.weekday > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <StatItem
                  value={mandatory.weekday}
                  label={
                    mandatory.weekday === 1 ? 'em dia útil' : 'em dias úteis'
                  }
                />
              </>
            )}
            {mandatory.weekend > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <StatItem
                  value={mandatory.weekend}
                  label={
                    mandatory.weekend === 1 ? 'no fim de semana' : 'no fim de semana'
                  }
                />
              </>
            )}
          </>
        )}

        {mandatory.bridge > 0 && (
          <>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">
              <StatItem
                value={mandatory.bridge}
                label="com potencial de emenda"
              />
            </span>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={[
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors duration-150 sm:hidden',
                open
                  ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300',
              ].join(' ')}
              aria-label={`Resumo de feriados em ${year}`}
              aria-expanded={open}
            >
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px]">Resumo</span>
            </button>
          </>
        )}

        {optional.total > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-400 dark:text-neutral-500">
              + {optional.total}{' '}
              {optional.total === 1 ? 'facultativo' : 'facultativos'}
            </span>
          </>
        )}
      </div>

      {open && mandatory.bridge > 0 && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-950/20 sm:hidden dark:bg-neutral-950/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 sm:absolute sm:bottom-auto sm:left-0 sm:right-auto sm:top-full sm:mt-1.5 sm:w-64 sm:p-3"
            role="dialog"
            aria-label={`Detalhes dos feriados em ${year}`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">
                Feriados em {year}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 sm:hidden"
                aria-label="Fechar resumo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {mandatory.bridge}
                </span>{' '}
                {mandatory.bridge === 1 ? 'cai em terça ou quinta' : 'caem em terça ou quinta'} —
                possível emendar com segunda ou sexta
              </li>
              {mandatory.weekday > 0 && (
                <li>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {mandatory.weekday}
                  </span>{' '}
                  {mandatory.weekday === 1 ? 'afeta dia útil' : 'afetam dias úteis'} (seg–sex)
                </li>
              )}
              {optional.total > 0 && (
                <li>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {optional.total}
                  </span>{' '}
                  {optional.total === 1 ? 'facultativo' : 'facultativos'} adicionais
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
