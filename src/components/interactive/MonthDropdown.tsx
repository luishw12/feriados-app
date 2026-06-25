import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HolidayType } from '@/data/schema';
import { MONTH_NAMES } from '@/lib/constants';
import MonthHolidayDots from '@/components/interactive/MonthHolidayDots';
import ScrollArea from '@/components/ui/ScrollArea';

interface Props {
  month: number;
  onChange: (month: number) => void;
  holidayTypesByMonth?: HolidayType[][];
}

export default function MonthDropdown({ month, onChange, holidayTypesByMonth }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentMonthTypes = holidayTypesByMonth?.[month] ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-2xl font-semibold tracking-tight text-neutral-900 transition-colors duration-150 hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
        aria-label={
          currentMonthTypes.length > 0
            ? `Selecionar mês — ${currentMonthTypes.length} feriados em ${MONTH_NAMES[month]}`
            : 'Selecionar mês'
        }
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          {MONTH_NAMES[month]}
          <MonthHolidayDots types={currentMonthTypes} size="md" />
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" />
      </button>

      {open && (
        <ScrollArea className="absolute left-0 top-full z-50 mt-1 max-h-56 w-48 rounded-xl border bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {MONTH_NAMES.map((name, index) => {
            const monthTypes = holidayTypesByMonth?.[index] ?? [];
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(index);
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors duration-150',
                  index === month
                    ? 'bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800',
                ].join(' ')}
              >
                <span>{name}</span>
                <MonthHolidayDots types={monthTypes} size="sm" />
              </button>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
