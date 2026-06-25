import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

interface Props {
  hasLocation: boolean;
}

const SCOPE_ITEMS = [
  { dot: 'bg-holiday-national', label: 'Nacional', dashed: false },
  { dot: 'bg-holiday-commemorative', label: 'Comemorativa', dashed: false },
  { dot: 'bg-holiday-state', label: 'Estadual', dashed: false },
  { dot: 'bg-holiday-municipal', label: 'Municipal', dashed: false },
  { dot: '', label: 'Regional', dashed: true },
] as const;

const OBLIGATION_ITEMS = [
  { dot: 'bg-neutral-700 dark:bg-neutral-300', label: 'Obrigatório' },
  { dot: 'bg-holiday-optional', label: 'Facultativo' },
  { dot: 'bg-holiday-state_optional', label: 'Facult. estadual' },
] as const;

function LegendContent({ hasLocation }: Props) {
  return (
    <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Abrangência
        </p>
        <ul className="space-y-2">
          {SCOPE_ITEMS.map((item) => {
            if (item.label === 'Regional' && hasLocation) return null;
            return (
              <li key={item.label} className="flex items-center gap-2.5">
                {item.dashed ? (
                  <span className="h-4 w-4 shrink-0 rounded border-2 border-dashed border-neutral-400 dark:border-neutral-500" />
                ) : (
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
                )}
                <span>{item.label}</span>
              </li>
            );
          })}
          {hasLocation && (
            <li className="flex items-center gap-2.5">
              <span className="flex gap-0.5">
                <span className="h-2.5 w-2.5 rounded-full bg-holiday-state" />
                <span className="h-2.5 w-2.5 rounded-full bg-holiday-municipal" />
              </span>
              <span>Feriados da sua região</span>
            </li>
          )}
        </ul>
        {!hasLocation && (
          <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
            Feriados regionais aparecem tracejados até você definir sua localização.
          </p>
        )}
      </div>

      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Tipo de feriado
        </p>
        <ul className="space-y-2">
          {OBLIGATION_ITEMS.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HolidayLegendPopover({ hasLocation }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
          'rounded-md p-1.5 text-neutral-400 transition-colors duration-150',
          open
            ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
            : 'hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300',
        ].join(' ')}
        aria-label="Legenda do calendário"
        aria-expanded={open}
      >
        <Info className="h-4 w-4 shrink-0" />
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
              'fixed bottom-20 left-4 right-4 max-h-[70vh] overflow-y-auto p-4',
              'sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-none sm:p-4',
            ].join(' ')}
            role="dialog"
            aria-label="Legenda do calendário"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Legenda do calendário
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                aria-label="Fechar legenda"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <LegendContent hasLocation={hasLocation} />
          </div>
        </>
      )}
    </div>
  );
}
