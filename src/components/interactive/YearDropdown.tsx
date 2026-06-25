import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ScrollArea from '@/components/ui/ScrollArea';
interface Props {
  year: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
}

export default function YearDropdown({
  year,
  onChange,
  minYear = 2020,
  maxYear = 2030,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

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
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-2xl font-semibold tabular-nums text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        aria-label="Selecionar ano"
        aria-expanded={open}
      >
        {year}
        <ChevronDown className="h-5 w-5 opacity-60" />
      </button>

      {open && (
        <ScrollArea className="absolute left-0 top-full z-50 mt-1 max-h-48 w-28 rounded-xl border bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                onChange(y);
                setOpen(false);
              }}
              className={[
                'block w-full px-3 py-1.5 text-left text-sm tabular-nums transition-colors duration-150',
                y === year
                  ? 'bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800',
              ].join(' ')}
            >
              {y}
            </button>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}
