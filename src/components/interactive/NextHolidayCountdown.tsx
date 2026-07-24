import { useEffect, useState } from 'react';
import type { ResolvedHoliday, SerializedResolvedHoliday } from '@/data/schema';
import { HOLIDAY_TYPE_COLORS, HOLIDAY_TYPE_LABELS } from '@/lib/constants';
import { deserializeHolidays, getNextHoliday } from '@/lib/holidays';
import { cn } from '@/lib/utils';

interface Props {
  holidays: SerializedResolvedHoliday[];
  className?: string;
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

export default function NextHolidayCountdown({ holidays, className }: Props) {
  const [nextHoliday, setNextHoliday] = useState<ResolvedHoliday | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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
  const colors = HOLIDAY_TYPE_COLORS[nextHoliday.type];
  const dayNum = nextHoliday.resolvedDate.getDate();
  const weekdayShort = nextHoliday.resolvedDate
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');

  const timeLabel = isToday
    ? 'Hoje'
    : [
        `${String(timeLeft.days).padStart(2, '0')}d`,
        `${String(timeLeft.hours).padStart(2, '0')}h`,
        `${String(timeLeft.minutes).padStart(2, '0')}m`,
        `${String(timeLeft.seconds).padStart(2, '0')}s`,
      ].join(' ');

  return (
    <a
      href={`/feriado/${nextHoliday.id}/`}
      className={cn(
        'flex min-w-0 max-w-[15rem] items-center gap-2.5 rounded-lg px-2 py-1.5 sm:max-w-[17rem]',
        className,
      )}
      aria-label={
        isToday
          ? `${nextHoliday.name} é hoje — ver detalhes`
          : `Próximo feriado: ${nextHoliday.name}`
      }
    >
      <div className="flex w-7 shrink-0 flex-col items-center">
        <span className="text-sm font-semibold tabular-nums leading-none text-neutral-900 dark:text-neutral-50">
          {dayNum}
        </span>
        <span className="mt-0.5 text-[10px] capitalize leading-none text-neutral-400">
          {weekdayShort}
        </span>
      </div>

      <span className={`h-10 w-0.5 shrink-0 rounded-full ${colors.dot}`} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium leading-snug text-neutral-900 dark:text-neutral-50">
          {nextHoliday.name}
        </p>
        <p className={`mt-0.5 truncate text-[10px] font-medium ${colors.text}`}>
          {HOLIDAY_TYPE_LABELS[nextHoliday.type]}
        </p>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
          {timeLabel}
        </p>
      </div>
    </a>
  );
}
