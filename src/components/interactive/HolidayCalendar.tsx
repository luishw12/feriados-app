import { useCallback, useMemo, useState } from 'react';
import type { HolidayType, ResolvedHoliday, SerializedResolvedHoliday } from '@/data/schema';
import {
  HOLIDAY_TYPE_COLORS,
  abbreviateHolidayName,
  getHolidayBadgeLabel,
  MONTH_NAMES,
  WEEKDAY_LABELS,
} from '@/lib/constants';
import { deserializeHolidays } from '@/lib/holidays';
import { formatDateKey } from '@/lib/dates';
import {
  computeYearHolidayStats,
  dedupeCalendarHolidays,
  getHolidayDedupeKey,
  isRegionalMuted,
} from '@/lib/holiday-stats';
import YearDropdown from '@/components/interactive/YearDropdown';
import MonthDropdown from '@/components/interactive/MonthDropdown';
import HolidayLegendPopover from '@/components/interactive/HolidayLegendPopover';
import YearStatsSummary from '@/components/interactive/YearStatsSummary';
import DayHolidaysDialog from '@/components/interactive/DayHolidaysDialog';
import ScrollArea from '@/components/ui/ScrollArea';

interface Props {
  year: number;
  onYearChange: (year: number) => void;
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  nationalHolidays: SerializedResolvedHoliday[];
  regionalHolidays: SerializedResolvedHoliday[];
  contextHolidays?: SerializedResolvedHoliday[];
  hasLocation: boolean;
}

interface DayHolidayEntry {
  id: string;
  name: string;
  type: HolidayType;
  muted: boolean;
}

interface DayMarker {
  holidays: DayHolidayEntry[];
}

interface SelectedDay {
  day: number;
  month: number;
}

const MAX_VISIBLE_HOLIDAY_CHIPS = 3;

function buildHolidayTypesByMonth(
  nationalHolidays: SerializedResolvedHoliday[],
  regionalHolidays: SerializedResolvedHoliday[],
  contextHolidays: SerializedResolvedHoliday[],
  hasLocation: boolean,
  year: number,
): HolidayType[][] {
  const byMonth: HolidayType[][] = Array.from({ length: 12 }, () => []);
  const seenByMonth = Array.from({ length: 12 }, () => new Set<string>());

  const all = deserializeHolidays([
    ...nationalHolidays,
    ...(hasLocation ? contextHolidays : regionalHolidays),
  ])
    .filter((holiday) => holiday.resolvedDate.getFullYear() === year)
    .sort((a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime());

  for (const holiday of all) {
    const month = holiday.resolvedDate.getMonth();
    const monthSet = seenByMonth[month];
    const monthTypes = byMonth[month];
    if (!monthSet || !monthTypes) continue;
    const dedupeKey = getHolidayDedupeKey(holiday, hasLocation);
    if (monthSet.has(dedupeKey)) continue;
    monthSet.add(dedupeKey);
    monthTypes.push(holiday.type);
  }

  return byMonth;
}

function buildDayMap(
  holidays: SerializedResolvedHoliday[],
  year: number,
  muted: boolean,
): Map<string, DayMarker> {
  const map = new Map<string, DayMarker>();

  for (const holiday of deserializeHolidays(holidays)) {
    if (holiday.resolvedDate.getFullYear() !== year) continue;
    const key = formatDateKey(holiday.resolvedDate);
    const existing = map.get(key) ?? { holidays: [] };
    existing.holidays.push({
      id: holiday.id,
      name: holiday.name,
      type: holiday.type,
      muted,
    });
    map.set(key, existing);
  }

  return map;
}

function mergeDayMaps(
  nationalMap: Map<string, DayMarker>,
  regionalMap: Map<string, DayMarker>,
  contextMap: Map<string, DayMarker>,
  hasLocation: boolean,
): Map<string, DayMarker> {
  const merged = new Map<string, DayMarker>();

  for (const [key, marker] of nationalMap) {
    merged.set(key, { holidays: marker.holidays.map((h) => ({ ...h })) });
  }

  if (hasLocation) {
    for (const [key, marker] of contextMap) {
      const existing = merged.get(key) ?? { holidays: [] };
      for (const holiday of marker.holidays) {
        if (!existing.holidays.some((entry) => entry.id === holiday.id)) {
          existing.holidays.push({ ...holiday, muted: false });
        }
      }
      merged.set(key, existing);
    }
    return merged;
  }

  for (const [key, marker] of regionalMap) {
    if (marker.holidays.length === 0) continue;
    const existing = merged.get(key) ?? { holidays: [] };
    if (!existing.holidays.some((entry) => entry.muted && entry.id === 'regional')) {
      existing.holidays.push({
        id: 'regional',
        name: 'Feriado regional',
        type: marker.holidays[0]?.type ?? 'state',
        muted: true,
      });
    }
    merged.set(key, existing);
  }

  return merged;
}

function HolidayDayChip({
  name,
  type,
  muted,
}: {
  name: string;
  type: HolidayType;
  muted: boolean;
}) {
  const colors = HOLIDAY_TYPE_COLORS[type];
  const label = abbreviateHolidayName(name, 9);

  return (
    <span
      className={[
        'block w-full min-w-0 truncate rounded-sm px-0.5 py-0.5 text-center text-[6px] font-semibold leading-tight sm:text-[7px] md:text-[8px]',
        muted
          ? 'border border-dashed border-neutral-300/80 bg-neutral-50 text-neutral-500 dark:border-neutral-600/50 dark:bg-neutral-800/40 dark:text-neutral-400'
          : [colors.bg, colors.text].join(' '),
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function MonthGrid({
  year,
  month,
  dayMap,
  size = 'large',
  onDayClick,
}: {
  year: number;
  month: number;
  dayMap: Map<string, DayMarker>;
  size?: 'large' | 'mini';
  onDayClick?: (day: number) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const isMini = size === 'mini';

  const weekdayHeader = (
    <div
      className={
        isMini
          ? 'mb-0.5 grid w-full grid-cols-7 gap-px text-center text-[8px] font-medium leading-none text-neutral-400'
          : 'grid grid-cols-7 border-b border-neutral-200/50 text-center text-xs font-medium text-neutral-400 dark:border-neutral-800/30'
      }
    >
      {WEEKDAY_LABELS.map((label) => (
        <span key={label} className={isMini ? 'py-0.5' : 'py-2'}>
          {isMini ? label.charAt(0) : label}
        </span>
      ))}
    </div>
  );

  const dayCells = (
    <>
      {Array.from({ length: startOffset }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className={
            isMini
              ? 'h-5'
              : 'min-h-[4.75rem] bg-white dark:bg-neutral-900/30 sm:min-h-[5.25rem]'
          }
          aria-hidden="true"
        />
      ))}
      {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const key = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const marker = dayMap.get(key);
          const primaryType = marker?.holidays[0]?.type;
          const dotClass = primaryType ? HOLIDAY_TYPE_COLORS[primaryType].dot : '';
          const isToday = isCurrentMonth && today.getDate() === day;
          const hasHolidays = Boolean(marker && marker.holidays.length > 0);
          const visibleHolidays = marker?.holidays.slice(0, MAX_VISIBLE_HOLIDAY_CHIPS) ?? [];
          const overflowCount = marker ? marker.holidays.length - MAX_VISIBLE_HOLIDAY_CHIPS : 0;

          if (isMini) {
            return (
              <div
                key={day}
                title={marker?.holidays.map((h) => h.name).join(', ')}
                className={[
                  'relative flex flex-col items-center justify-center',
                  'h-5 rounded-sm text-[9px] leading-none',
                  isToday ? 'font-bold ring-1 ring-emerald-500 dark:ring-emerald-400' : '',
                  marker
                    ? marker.holidays.some((h) => h.muted)
                      ? 'border-2 border-dashed border-neutral-400 bg-neutral-50/80 text-neutral-400 dark:border-neutral-500 dark:bg-neutral-900/80 dark:text-neutral-500'
                      : 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                    : 'text-neutral-500 dark:text-neutral-500',
                ].join(' ')}
              >
                <span>{day}</span>
                {primaryType && (
                  <span className={`mt-px h-0.5 w-0.5 rounded-full ${dotClass}`} />
                )}
              </div>
            );
          }

          const cellClass = [
            'relative flex min-w-0 flex-col gap-0.5 overflow-hidden p-1.5 text-sm',
            'min-h-[4.75rem] bg-white sm:min-h-[5.25rem] dark:bg-neutral-900/30',
            isToday ? 'ring-1 ring-inset ring-emerald-500/50 dark:ring-emerald-400/40' : '',
            hasHolidays
              ? marker?.holidays.some((h) => h.muted)
                ? 'text-neutral-500 dark:text-neutral-400'
                : 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-500',
            hasHolidays && onDayClick
              ? 'cursor-pointer transition-colors duration-150 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/25'
              : '',
          ].join(' ');

          const content = (
            <>
              <span
                className={[
                  'shrink-0 px-0.5 tabular-nums',
                  isToday ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'font-medium',
                ].join(' ')}
              >
                {day}
              </span>
              {hasHolidays && (
                <div className="flex min-h-0 flex-1 flex-col justify-end gap-px">
                  {visibleHolidays.map((holiday, chipIndex) => (
                    <HolidayDayChip
                      key={`${holiday.id}-${holiday.type}-${chipIndex}`}
                      name={holiday.name}
                      type={holiday.type}
                      muted={holiday.muted}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <span className="block w-full rounded-sm bg-neutral-100/90 px-0.5 py-0.5 text-center text-[6px] font-semibold leading-tight text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400 sm:text-[7px] md:text-[8px]">
                      +{overflowCount}
                    </span>
                  )}
                </div>
              )}
            </>
          );

          if (hasHolidays && onDayClick) {
            return (
              <button
                key={day}
                type="button"
                onClick={() => onDayClick(day)}
                className={cellClass}
                aria-label={`Ver feriados do dia ${day}`}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={day} className={cellClass}>
              {content}
            </div>
          );
        })}
    </>
  );

  if (isMini) {
    return (
      <div className="w-full">
        {weekdayHeader}
        <div className="grid w-full grid-cols-7 gap-px">{dayCells}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/50 dark:border-neutral-800/25">
      {weekdayHeader}
      <div className="grid grid-cols-7 auto-rows-[minmax(4.75rem,1fr)] divide-x divide-y divide-neutral-100/90 dark:divide-neutral-800/20 sm:auto-rows-[minmax(5.25rem,1fr)]">
        {dayCells}
      </div>
    </div>
  );
}

export default function HolidayCalendar({
  year,
  onYearChange,
  selectedMonth,
  onMonthSelect,
  nationalHolidays,
  regionalHolidays,
  contextHolidays = [],
  hasLocation,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const dayMap = useMemo(() => {
    const nationalMap = buildDayMap(nationalHolidays, year, false);
    const regionalMap = buildDayMap(regionalHolidays, year, true);
    const contextMap = buildDayMap(contextHolidays, year, false);
    return mergeDayMaps(nationalMap, regionalMap, contextMap, hasLocation);
  }, [nationalHolidays, regionalHolidays, contextHolidays, hasLocation, year]);

  const getHolidaysForDay = useCallback(
    (month: number, day: number): ResolvedHoliday[] => {
      const all = deserializeHolidays([
        ...nationalHolidays,
        ...(hasLocation ? contextHolidays : regionalHolidays),
      ]).filter((holiday) => {
        const date = holiday.resolvedDate;
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
      });

      return dedupeCalendarHolidays(all, hasLocation);
    },
    [nationalHolidays, regionalHolidays, contextHolidays, hasLocation, year],
  );

  const holidayTypesByMonth = useMemo(
    () =>
      buildHolidayTypesByMonth(
        nationalHolidays,
        regionalHolidays,
        contextHolidays,
        hasLocation,
        year,
      ),
    [nationalHolidays, regionalHolidays, contextHolidays, hasLocation, year],
  );

  const monthHolidays = useMemo(() => {
    const all = deserializeHolidays([
      ...nationalHolidays,
      ...(hasLocation ? contextHolidays : regionalHolidays),
    ]).filter(
      (h) => h.resolvedDate.getFullYear() === year && h.resolvedDate.getMonth() === selectedMonth,
    );

    return dedupeCalendarHolidays(all, hasLocation);
  }, [nationalHolidays, regionalHolidays, contextHolidays, hasLocation, year, selectedMonth]);

  const yearStats = useMemo(
    () =>
      computeYearHolidayStats(
        nationalHolidays,
        regionalHolidays,
        contextHolidays,
        hasLocation,
        year,
      ),
    [nationalHolidays, regionalHolidays, contextHolidays, hasLocation, year],
  );

  const handleDayClick = useCallback((day: number) => {
    setSelectedDay({ day, month: selectedMonth });
  }, [selectedMonth]);

  const selectedDayHolidays = selectedDay
    ? getHolidaysForDay(selectedDay.month, selectedDay.day)
    : [];

  return (
    <div className="flex h-full min-h-0 gap-4 lg:gap-5">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <MonthDropdown
              month={selectedMonth}
              onChange={onMonthSelect}
              holidayTypesByMonth={holidayTypesByMonth}
            />
            <YearDropdown year={year} onChange={onYearChange} />
          </div>
          <HolidayLegendPopover hasLocation={hasLocation} />
        </div>

        <YearStatsSummary stats={yearStats} year={year} />

        <div className="shrink-0">
          <MonthGrid
            year={year}
            month={selectedMonth}
            dayMap={dayMap}
            size="large"
            onDayClick={handleDayClick}
          />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <h3 className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Feriados em {MONTH_NAMES[selectedMonth]}
            {monthHolidays.length > 0 && (
              <span className="ml-1.5 text-neutral-300 dark:text-neutral-600">
                ({monthHolidays.length})
              </span>
            )}
          </h3>

          {monthHolidays.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum feriado neste mês.</p>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <ul className="space-y-2 pb-4 pr-2">
                {monthHolidays.map((holiday) => {
                  const muted = isRegionalMuted(holiday.type, hasLocation);
                  const colors = HOLIDAY_TYPE_COLORS[holiday.type];
                  const dayNum = holiday.resolvedDate.getDate();
                  const weekday = holiday.resolvedDate.toLocaleDateString('pt-BR', {
                    weekday: 'short',
                  });

                  return (
                    <li key={`${holiday.id}-${holiday.resolvedDate.toISOString()}`}>
                      <a
                        href={`/feriado/${holiday.id}/`}
                        className={[
                          'flex gap-3 rounded-xl border p-3 transition-colors duration-150',
                          muted
                            ? 'border-dashed border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:border-neutral-600'
                            : 'border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20',
                        ].join(' ')}
                        aria-label={
                          muted
                            ? `Ver detalhes do feriado regional em ${dayNum} de ${MONTH_NAMES[selectedMonth]}`
                            : `Ver detalhes de ${holiday.name}`
                        }
                      >
                        <div className="flex w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-neutral-100 py-1 dark:bg-neutral-800">
                          <span className="text-lg font-semibold tabular-nums leading-none text-neutral-900 dark:text-neutral-50">
                            {dayNum}
                          </span>
                          <span className="mt-0.5 text-[10px] uppercase text-neutral-400">
                            {weekday}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug text-neutral-900 dark:text-neutral-50">
                            {muted ? 'Feriado regional' : holiday.name}
                          </p>
                          <div className="mt-1.5">
                            <span
                              className={[
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                colors.bg,
                                colors.text,
                              ].join(' ')}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                              {getHolidayBadgeLabel(holiday.type)}
                            </span>
                          </div>
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
            </ScrollArea>
          )}
        </div>
      </div>

      <aside className="hidden min-h-0 w-48 shrink-0 self-stretch lg:flex lg:flex-col xl:w-52">
        <p className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Outros meses
        </p>
        <ScrollArea as="nav" aria-label="Outros meses" className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pb-8 pr-1">
            {MONTH_NAMES.map((name, month) => {
              const isSelected = month === selectedMonth;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onMonthSelect(month)}
                  className={[
                    'w-full shrink-0 rounded-xl border px-1.5 py-1.5 text-left transition-colors duration-150',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 dark:border-emerald-600 dark:bg-emerald-950/30'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'mb-0.5 px-0.5 text-[11px] font-semibold',
                      isSelected
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-neutral-600 dark:text-neutral-400',
                    ].join(' ')}
                  >
                    {name}
                  </p>
                  <MonthGrid year={year} month={month} dayMap={dayMap} size="mini" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {selectedDay && selectedDayHolidays.length > 0 && (
        <DayHolidaysDialog
          day={selectedDay.day}
          month={selectedDay.month}
          year={year}
          holidays={selectedDayHolidays}
          hasLocation={hasLocation}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
