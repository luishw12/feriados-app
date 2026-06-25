import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { HolidayType, ResolvedHoliday } from '@/data/schema';
import { HOLIDAY_TYPE_COLORS, getHolidayBadgeLabel, MONTH_NAMES } from '@/lib/constants';

interface Props {
  day: number;
  month: number;
  year: number;
  holidays: ResolvedHoliday[];
  hasLocation: boolean;
  onClose: () => void;
}

function isRegionalMuted(type: HolidayType, hasLocation: boolean): boolean {
  if (hasLocation) return false;
  return type !== 'national' && type !== 'optional' && type !== 'commemorative';
}

export default function DayHolidaysDialog({
  day,
  month,
  year,
  holidays,
  hasLocation,
  onClose,
}: Props) {
  const date = new Date(year, month, day);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm dark:bg-neutral-950/60"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div
        className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 sm:max-w-md sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-holidays-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4 dark:border-neutral-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {MONTH_NAMES[month]} {year}
            </p>
            <h2
              id="day-holidays-title"
              className="mt-0.5 text-lg font-semibold capitalize text-neutral-900 dark:text-neutral-50"
            >
              {formattedDate}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {holidays.length} {holidays.length === 1 ? 'feriado' : 'feriados'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="overflow-y-auto px-4 py-3">
          {holidays.map((holiday) => {
            const muted = isRegionalMuted(holiday.type, hasLocation);
            const colors = HOLIDAY_TYPE_COLORS[holiday.type];

            return (
              <li key={`${holiday.id}-${holiday.resolvedDate.toISOString()}`} className="py-1">
                <a
                  href={`/feriado/${holiday.id}/`}
                  className={[
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors duration-150',
                    muted
                      ? 'border-dashed border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:border-neutral-600'
                      : 'border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      muted ? 'bg-neutral-100 dark:bg-neutral-800' : colors.bg,
                    ].join(' ')}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-neutral-900 dark:text-neutral-50">
                      {muted ? 'Feriado regional' : holiday.name}
                    </p>
                    <span
                      className={[
                        'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        colors.bg,
                        colors.text,
                      ].join(' ')}
                    >
                      {getHolidayBadgeLabel(holiday.type)}
                    </span>
                    {muted && (
                      <p className="mt-1 text-[11px] italic text-neutral-400">
                        Varia conforme seu estado ou cidade
                      </p>
                    )}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
