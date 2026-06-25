import { useEffect, useLayoutEffect, useState } from 'react';
import { ChevronDown, Timer } from 'lucide-react';
import type { ResolvedHoliday, SerializedResolvedHoliday } from '@/data/schema';
import { deserializeHolidays, getNextHoliday } from '@/lib/holidays';

interface Props {
  holidays: SerializedResolvedHoliday[];
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isHolidayToday(target: Date): boolean {
  return isSameCalendarDay(target, new Date());
}

function getTimeLeft(target: Date): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 1023px)').matches;
}

export default function FloatingCountdown({ holidays }: Props) {
  const [nextHoliday, setNextHoliday] = useState<ResolvedHoliday | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    // Inicia sempre fechado (apenas a "pílula"); o usuário expande quando quiser.
    setIsMobile(isMobileViewport());
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    function handleChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const parsed = deserializeHolidays(holidays);
    setNextHoliday(getNextHoliday(parsed));
  }, [holidays]);

  useEffect(() => {
    if (!nextHoliday) return undefined;

    const tick = () => setTimeLeft(getTimeLeft(nextHoliday.resolvedDate));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [nextHoliday]);

  if (!nextHoliday) return null;

  const isToday = isHolidayToday(nextHoliday.resolvedDate);
  const positionClass = isMobile ? 'bottom-4 left-3 right-3' : 'bottom-4 left-4';

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={[
          'fixed z-50 flex items-center gap-2 rounded-full border bg-white/95 px-3.5 py-2 text-sm font-medium text-neutral-800 shadow-lg backdrop-blur transition-colors duration-150 hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-100',
          positionClass,
          isMobile ? 'max-w-[calc(100%-1.5rem)]' : '',
          isToday && 'border-emerald-300 dark:border-emerald-700',
        ].join(' ')}
        aria-label={
          isToday
            ? `Expandir — ${nextHoliday.name} é hoje`
            : 'Expandir contador do próximo feriado'
        }
      >
        <Timer
          className={[
            'h-4 w-4 shrink-0',
            isToday ? 'text-emerald-500 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400',
          ].join(' ')}
        />
        <span className="min-w-0 truncate font-medium">{nextHoliday.name}</span>
        {isToday ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            Hoje
          </span>
        ) : (
          <span className="shrink-0 font-mono text-xs tabular-nums text-emerald-700 dark:text-emerald-400">
            {String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={[
        'fixed z-50 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95',
        positionClass,
        isMobile ? 'w-auto' : 'w-72',
        isToday && 'border-emerald-300 dark:border-emerald-700',
      ].join(' ')}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isToday ? 'Acontecendo hoje' : 'Próximo feriado'}
          </p>
          <p className="truncate font-medium text-neutral-900 dark:text-neutral-50">
            {nextHoliday.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 rounded-lg p-1 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          aria-label="Minimizar"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isToday ? (
        <a
          href={`/feriado/${nextHoliday.id}/`}
          className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-100/80 dark:border-emerald-800 dark:bg-emerald-950/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/60"
        >
          <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            Hoje
          </span>
          <span className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Aproveite o dia
          </span>
          <span className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80">
            Ver detalhes →
          </span>
        </a>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'd', value: timeLeft.days },
            { label: 'h', value: timeLeft.hours },
            { label: 'm', value: timeLeft.minutes },
            { label: 's', value: timeLeft.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="rounded-lg bg-neutral-100 px-1 py-2 text-center dark:bg-neutral-800"
            >
              <div className="font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {String(unit.value).padStart(2, '0')}
              </div>
              <div className="text-xs text-neutral-400">{unit.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
