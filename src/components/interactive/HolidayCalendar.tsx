import { useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { HolidayCategory, HolidayType, ResolvedHoliday, SerializedResolvedHoliday } from '@/data/schema';
import {
  HOLIDAY_TYPE_COLORS,
  HOLIDAY_TYPE_LABELS,
  MONTH_NAMES,
  WEEKDAY_LABELS,
} from '@/lib/constants';
import { filterHolidaysByCategory } from '@/lib/holiday-categories';
import { deserializeHolidays } from '@/lib/holidays';
import { formatDateKey } from '@/lib/dates';
import {
  computeYearHolidayStats,
  dedupeCalendarHolidays,
  getHolidayDedupeKey,
  isRegionalMuted,
} from '@/lib/holiday-stats';
import YearDropdown from '@/components/interactive/YearDropdown';
import HolidayLegendPopover from '@/components/interactive/HolidayLegendPopover';
import CategoryFilter from '@/components/interactive/CategoryFilter';
import YearStatsSummary from '@/components/interactive/YearStatsSummary';
import DayHolidaysDialog from '@/components/interactive/DayHolidaysDialog';
import HolidayContributionActions from '@/components/interactive/HolidayContributionActions';
import MonthStrip from '@/components/interactive/MonthStrip';
import NextHolidayCountdown from '@/components/interactive/NextHolidayCountdown';
import type { LocationContext } from '@/lib/location-storage';
import {
  buildContributionDetailFromCalendarDay,
  buildHolidayContextFromResolvedHoliday,
  openContributionModal,
} from '@/lib/contributions';

interface Props {
  year: number;
  onYearChange: (year: number) => void;
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  nationalHolidays: SerializedResolvedHoliday[];
  regionalHolidays: SerializedResolvedHoliday[];
  contextHolidays?: SerializedResolvedHoliday[];
  hasLocation: boolean;
  location: LocationContext | null;
  selectedCategories: ReadonlySet<HolidayCategory>;
  onCategoriesChange: (selected: Set<HolidayCategory>) => void;
  countdownHolidays?: SerializedResolvedHoliday[];
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

function HolidayDots({ holidays }: { holidays: DayHolidayEntry[] }) {
  const uniqueTypes = [...new Set(holidays.map((h) => h.type))].slice(0, 3);
  const hasMuted = holidays.some((h) => h.muted);

  return (
    <span className="flex items-center justify-center gap-0.5">
      {hasMuted && uniqueTypes.length === 0 ? (
        <span className="h-1.5 w-1.5 rounded-full border border-dashed border-neutral-400 dark:border-neutral-500" />
      ) : (
        uniqueTypes.map((type) => (
          <span
            key={type}
            className={`h-1.5 w-1.5 rounded-full ${HOLIDAY_TYPE_COLORS[type].dot}`}
          />
        ))
      )}
      {holidays.length > 3 && (
        <span className="text-[9px] font-medium text-neutral-400">+</span>
      )}
    </span>
  );
}

function MonthGrid({
  year,
  month,
  dayMap,
  onDayClick,
  onContributeDay,
}: {
  year: number;
  month: number;
  dayMap: Map<string, DayMarker>;
  onDayClick?: (day: number) => void;
  onContributeDay?: (day: number) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="calendar-grid flex h-full min-h-0 flex-col">
      <div className="mb-1.5 grid shrink-0 grid-cols-7 gap-1 sm:mb-2 sm:gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="py-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-neutral-400 sm:py-1 sm:text-[11px]"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 auto-rows-fr gap-1 sm:gap-1.5">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-0" aria-hidden="true" />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const key = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const marker = dayMap.get(key);
          const isToday = isCurrentMonth && today.getDate() === day;
          const hasHolidays = Boolean(marker && marker.holidays.length > 0);
          const isMuted = marker?.holidays.some((h) => h.muted) ?? false;
          const primaryType = marker?.holidays[0]?.type;
          const tintClass = hasHolidays && primaryType && !isMuted
            ? HOLIDAY_TYPE_COLORS[primaryType].bg
            : '';

          const cellClass = [
            'calendar-day group relative flex min-h-0 h-full flex-col items-center justify-between rounded-lg p-1 transition-all duration-150 sm:rounded-xl sm:p-1.5',
            isToday
              ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-950'
              : 'ring-1 ring-neutral-200/60 dark:ring-neutral-800/60',
            hasHolidays
              ? isMuted
                ? 'border border-dashed border-neutral-300 bg-neutral-50/80 dark:border-neutral-600 dark:bg-neutral-900/50'
                : `${tintClass} hover:shadow-sm`
              : 'bg-white/50 hover:bg-white/80 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50',
            hasHolidays && onDayClick ? 'cursor-pointer hover:ring-emerald-500/30' : '',
          ].join(' ');

          const dayNumberClass = [
            'relative z-[1] text-sm font-medium tabular-nums',
            isToday
              ? 'text-emerald-600 dark:text-emerald-400'
              : hasHolidays
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-500',
          ].join(' ');

          return (
            <div key={day} className={cellClass}>
              {hasHolidays && onDayClick && (
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600"
                  aria-label={`${day} de ${MONTH_NAMES[month]}${marker ? `, ${marker.holidays.map((h) => h.name).join(', ')}` : ''}`}
                />
              )}

              <span className={dayNumberClass}>{day}</span>

              {hasHolidays ? (
                <span className="relative z-[1]">
                  <HolidayDots holidays={marker?.holidays ?? []} />
                </span>
              ) : (
                <span className="h-1.5" aria-hidden="true" />
              )}

              {onContributeDay && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onContributeDay(day);
                  }}
                  className={[
                    'absolute right-0.5 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-md sm:right-1 sm:top-1 sm:h-7 sm:w-7',
                    'bg-emerald-600 text-white shadow-sm',
                    'opacity-0 transition-opacity duration-150',
                    'hover:bg-emerald-500',
                    'group-hover:opacity-100 group-focus-within:opacity-100',
                    'focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600',
                    'dark:bg-emerald-500 dark:hover:bg-emerald-400',
                  ].join(' ')}
                  aria-label={`Sugerir feriado em ${day} de ${MONTH_NAMES[month]}`}
                  title="Sugerir feriado"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HolidayTimelineCard({
  holiday,
  hasLocation,
  location,
  selectedMonth,
}: {
  holiday: ResolvedHoliday;
  hasLocation: boolean;
  location: LocationContext | null;
  selectedMonth: number;
}) {
  const muted = isRegionalMuted(holiday.type, hasLocation);
  const colors = HOLIDAY_TYPE_COLORS[holiday.type];
  const dayNum = holiday.resolvedDate.getDate();
  const weekdayShort = holiday.resolvedDate
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
  const monthName = MONTH_NAMES[selectedMonth];
  const showContribute = !muted && holiday.id !== 'regional';

  return (
    <li className="group relative">
      <a
        href={`/feriado/${holiday.id}/`}
        className={[
          'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150',
          'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50',
          showContribute ? 'pr-10' : '',
        ].join(' ')}
        aria-label={
          muted
            ? `Ver feriado regional em ${dayNum} de ${monthName}`
            : `Ver detalhes de ${holiday.name}`
        }
      >
        <div className="flex w-8 shrink-0 flex-col items-center">
          <span className="text-base font-semibold tabular-nums leading-none text-neutral-900 dark:text-neutral-50">
            {dayNum}
          </span>
          <span className="mt-0.5 text-[10px] capitalize leading-none text-neutral-400">
            {weekdayShort}
          </span>
        </div>

        <span
          className={`h-8 w-0.5 shrink-0 rounded-full ${muted ? 'bg-neutral-300 dark:bg-neutral-700' : colors.dot}`}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <p
            className={[
              'truncate text-sm font-medium leading-snug',
              muted
                ? 'text-neutral-500 dark:text-neutral-400'
                : 'text-neutral-900 group-hover:text-emerald-700 dark:text-neutral-50 dark:group-hover:text-emerald-400',
            ].join(' ')}
          >
            {muted ? 'Feriado regional' : holiday.name}
          </p>
          <p className={`mt-0.5 truncate text-[11px] font-medium ${colors.text}`}>
            {HOLIDAY_TYPE_LABELS[holiday.type]}
          </p>
        </div>
      </a>

      {showContribute && (
        <HolidayContributionActions
          variant="inline"
          holidayId={holiday.id}
          holidayName={holiday.name}
          pageUrl={`/feriado/${holiday.id}/`}
          holiday={buildHolidayContextFromResolvedHoliday(holiday, location)}
        />
      )}
    </li>
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
  location,
  selectedCategories,
  onCategoriesChange,
  countdownHolidays = [],
}: Props) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const filteredNational = useMemo(
    () => filterHolidaysByCategory(nationalHolidays, selectedCategories),
    [nationalHolidays, selectedCategories],
  );

  const filteredRegional = useMemo(
    () => filterHolidaysByCategory(regionalHolidays, selectedCategories),
    [regionalHolidays, selectedCategories],
  );

  const filteredContext = useMemo(
    () => filterHolidaysByCategory(contextHolidays, selectedCategories),
    [contextHolidays, selectedCategories],
  );

  const hasCategorySelection = selectedCategories.size > 0;

  const dayMap = useMemo(() => {
    if (!hasCategorySelection) return new Map<string, DayMarker>();
    const nationalMap = buildDayMap(filteredNational, year, false);
    const regionalMap = buildDayMap(filteredRegional, year, true);
    const contextMap = buildDayMap(filteredContext, year, false);
    return mergeDayMaps(nationalMap, regionalMap, contextMap, hasLocation);
  }, [
    filteredNational,
    filteredRegional,
    filteredContext,
    hasLocation,
    hasCategorySelection,
    year,
  ]);

  const getHolidaysForDay = useCallback(
    (month: number, day: number): ResolvedHoliday[] => {
      if (!hasCategorySelection) return [];
      const all = deserializeHolidays([
        ...filteredNational,
        ...(hasLocation ? filteredContext : filteredRegional),
      ]).filter((holiday) => {
        const date = holiday.resolvedDate;
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
      });

      return dedupeCalendarHolidays(all, hasLocation);
    },
    [
      filteredNational,
      filteredRegional,
      filteredContext,
      hasLocation,
      hasCategorySelection,
      year,
    ],
  );

  const getAllHolidaysForDay = useCallback(
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
      hasCategorySelection
        ? buildHolidayTypesByMonth(
            filteredNational,
            filteredRegional,
            filteredContext,
            hasLocation,
            year,
          )
        : Array.from({ length: 12 }, () => []),
    [
      filteredNational,
      filteredRegional,
      filteredContext,
      hasLocation,
      hasCategorySelection,
      year,
    ],
  );

  const monthHolidays = useMemo(() => {
    if (!hasCategorySelection) return [];
    const all = deserializeHolidays([
      ...filteredNational,
      ...(hasLocation ? filteredContext : filteredRegional),
    ]).filter(
      (h) => h.resolvedDate.getFullYear() === year && h.resolvedDate.getMonth() === selectedMonth,
    );

    return dedupeCalendarHolidays(all, hasLocation);
  }, [
    filteredNational,
    filteredRegional,
    filteredContext,
    hasLocation,
    hasCategorySelection,
    year,
    selectedMonth,
  ]);

  const yearStats = useMemo(
    () =>
      computeYearHolidayStats(
        filteredNational,
        filteredRegional,
        filteredContext,
        hasLocation,
        year,
      ),
    [filteredNational, filteredRegional, filteredContext, hasLocation, year],
  );

  const handleDayClick = useCallback((day: number) => {
    setSelectedDay({ day, month: selectedMonth });
  }, [selectedMonth]);

  const handleContributeDay = useCallback(
    (day: number) => {
      const holidays = getAllHolidaysForDay(selectedMonth, day);
      const detail = buildContributionDetailFromCalendarDay(
        selectedMonth,
        day,
        holidays,
        location,
      );
      openContributionModal(detail);
    },
    [getAllHolidaysForDay, location, selectedMonth],
  );

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      onYearChange(year - 1);
      onMonthSelect(11);
    } else {
      onMonthSelect(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      onYearChange(year + 1);
      onMonthSelect(0);
    } else {
      onMonthSelect(selectedMonth + 1);
    }
  };

  const selectedDayHolidays = selectedDay
    ? getHolidaysForDay(selectedDay.month, selectedDay.day)
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden animate-fade-in lg:gap-4">
      {/* Toolbar */}
      <div className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="rounded-lg p-2 text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">
                  {MONTH_NAMES[selectedMonth]}
                </h2>
                <YearDropdown year={year} onChange={onYearChange} size="sm" />
              </div>

              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-lg p-2 text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {countdownHolidays.length > 0 && (
              <NextHolidayCountdown holidays={countdownHolidays} className="min-w-0" />
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <YearStatsSummary stats={yearStats} year={year} />
            <CategoryFilter selected={selectedCategories} onChange={onCategoriesChange} />
            <HolidayLegendPopover hasLocation={hasLocation} />
          </div>
        </div>

        <MonthStrip
          selectedMonth={selectedMonth}
          onMonthSelect={onMonthSelect}
          holidayTypesByMonth={holidayTypesByMonth}
        />
      </div>

      {/* Main content: calendar + sidebar */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden lg:gap-5">
        {/* Calendar */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/50 p-2 backdrop-blur-sm dark:border-neutral-800/60 dark:bg-neutral-900/30 sm:p-3">
            <MonthGrid
              year={year}
              month={selectedMonth}
              dayMap={dayMap}
              onDayClick={handleDayClick}
              onContributeDay={handleContributeDay}
            />
          </div>
        </div>

        {/* Holiday panel */}
        <aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden lg:flex lg:flex-col xl:w-80">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/50 backdrop-blur-sm dark:border-neutral-800/60 dark:bg-neutral-900/30">
            <div className="shrink-0 border-b border-neutral-200/60 px-3 py-2.5 dark:border-neutral-800/60">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Feriados em {MONTH_NAMES[selectedMonth]}
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {monthHolidays.length === 0
                  ? 'Nenhum feriado neste mês'
                  : `${monthHolidays.length} ${monthHolidays.length === 1 ? 'data' : 'datas'} no calendário`}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {monthHolidays.length === 0 ? (
                <p className="p-3 text-sm text-neutral-500">
                  {hasCategorySelection
                    ? 'Nenhum feriado com os temas selecionados.'
                    : 'Selecione ao menos um tema para ver feriados.'}
                </p>
              ) : (
                <ol className="divide-y divide-neutral-200/50 p-1.5 dark:divide-neutral-800/50">
                  {monthHolidays.map((holiday) => (
                    <HolidayTimelineCard
                      key={`${holiday.id}-${holiday.resolvedDate.toISOString()}`}
                      holiday={holiday}
                      hasLocation={hasLocation}
                      location={location}
                      selectedMonth={selectedMonth}
                    />
                  ))}
                </ol>
              )}
            </div>
          </div>
        </aside>
      </div>

      {selectedDay && selectedDayHolidays.length > 0 && (
        <DayHolidaysDialog
          day={selectedDay.day}
          month={selectedDay.month}
          year={year}
          holidays={selectedDayHolidays}
          hasLocation={hasLocation}
          location={location}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
