import type { HolidayType } from '@/data/schema';
import { MONTH_NAMES } from '@/lib/constants';
import MonthHolidayDots from '@/components/interactive/MonthHolidayDots';

const MONTH_ABBREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface Props {
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  holidayTypesByMonth: HolidayType[][];
}

export default function MonthStrip({
  selectedMonth,
  onMonthSelect,
  holidayTypesByMonth,
}: Props) {
  return (
    <nav
      aria-label="Selecionar mês"
      className="grid grid-cols-6 gap-1 sm:grid-cols-12 sm:gap-1.5"
    >
      {MONTH_NAMES.map((name, month) => {
        const isSelected = month === selectedMonth;
        const holidayCount = holidayTypesByMonth[month]?.length ?? 0;
        const monthTypes = holidayTypesByMonth[month] ?? [];

        return (
          <button
            key={name}
            type="button"
            onClick={() => onMonthSelect(month)}
            aria-current={isSelected ? 'true' : undefined}
            aria-label={
              holidayCount > 0
                ? `${name}, ${holidayCount} feriados`
                : name
            }
            className={[
              'flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition-all duration-200 sm:gap-1 sm:rounded-xl sm:px-2 sm:py-2',
              isSelected
                ? 'border-emerald-500/40 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20'
                : 'border-transparent bg-neutral-100/60 hover:border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800/40 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/70',
            ].join(' ')}
          >
            <span
              className={[
                'text-[10px] font-semibold uppercase tracking-wide sm:text-xs',
                isSelected
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400',
              ].join(' ')}
            >
              {MONTH_ABBREV[month]}
            </span>
            {holidayCount > 0 ? (
              <span className="flex items-center gap-0.5 sm:gap-1">
                <MonthHolidayDots types={monthTypes} size="sm" />
                <span
                  className={[
                    'text-[9px] font-medium tabular-nums sm:text-[10px]',
                    isSelected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-neutral-400 dark:text-neutral-500',
                  ].join(' ')}
                >
                  {holidayCount}
                </span>
              </span>
            ) : (
              <span className="h-2 sm:h-2.5" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
