import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { HolidayCategory, SerializedResolvedHoliday } from '@/data/schema';
import { resolveHolidayDate } from '@/lib/dates';
import type { Holiday } from '@/data/schema';
import LocationPicker, { type LocationContext } from '@/components/interactive/LocationPicker';
import FloatingCountdown from '@/components/interactive/FloatingCountdown';
import HolidayCalendar from '@/components/interactive/HolidayCalendar';
import CalendarSkeleton from '@/components/interactive/CalendarSkeleton';
import {
  getInitialCategoryFilters,
  saveStoredCategoryFilters,
} from '@/lib/category-filter-storage';
import { filterHolidaysByCategory } from '@/lib/holiday-categories';
import {
  buildMunicipalHolidaysFromIndex,
  findMunicipalityInIndex,
  loadMunicipalityIndex,
} from '@/lib/municipality-index';
import type { StateOption } from '@/lib/municipality-search';
import {
  isLocationPromptDismissed,
  loadStoredLocationContext,
  subscribeLocationUpdated,
} from '@/lib/location-storage';

interface RawHoliday extends Holiday {
  state?: string;
  city?: string;
}

interface Props {
  initialYear: number;
  states: StateOption[];
  nationalHolidays: Holiday[];
  stateHolidaysByUf: Record<string, Holiday[]>;
  stateRegionalHolidays: Holiday[];
}

function resolveForYear(holidays: RawHoliday[], year: number): SerializedResolvedHoliday[] {
  return holidays.map((holiday) => ({
    ...holiday,
    resolvedDate: resolveHolidayDate(holiday, year).toISOString(),
  }));
}

function serializeUnique(holidays: SerializedResolvedHoliday[]): SerializedResolvedHoliday[] {
  const seen = new Set<string>();
  return holidays.filter((holiday) => {
    const key = `${holiday.id}-${holiday.resolvedDate}-${holiday.state ?? ''}-${holiday.city ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getInitialCalendarReady(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(loadStoredLocationContext()) || isLocationPromptDismissed();
}

export default function HomeInteractive({
  initialYear,
  states,
  nationalHolidays,
  stateHolidaysByUf,
  stateRegionalHolidays,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [isCalendarReady, setIsCalendarReady] = useState(getInitialCalendarReady);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<HolidayCategory>>(
    getInitialCategoryFilters,
  );
  const [municipalHolidays, setMunicipalHolidays] = useState<Holiday[]>([]);

  const handleCategoriesChange = useCallback((next: Set<HolidayCategory>) => {
    setSelectedCategories(next);
    saveStoredCategoryFilters(next);
  }, []);

  useLayoutEffect(() => {
    setHeaderSlot(document.getElementById('header-location-slot'));
  }, []);

  useLayoutEffect(() => {
    const stored = loadStoredLocationContext();
    if (stored) {
      setLocation(stored);
      setIsCalendarReady(true);
    }
  }, []);

  useEffect(() => {
    const syncLocation = () => {
      setLocation(loadStoredLocationContext());
      setIsCalendarReady(true);
    };

    return subscribeLocationUpdated(syncLocation);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!location?.citySlug) {
      setMunicipalHolidays([]);
      return () => {
        cancelled = true;
      };
    }

    void loadMunicipalityIndex()
      .then((index) => {
        if (cancelled) return;
        const municipality = findMunicipalityInIndex(index, location.uf, location.citySlug ?? '');
        setMunicipalHolidays(
          municipality ? buildMunicipalHolidaysFromIndex(municipality) : [],
        );
      })
      .catch(() => {
        if (!cancelled) setMunicipalHolidays([]);
      });

    return () => {
      cancelled = true;
    };
  }, [location?.citySlug, location?.uf]);

  const handleLocationChange = useCallback((next: LocationContext | null) => {
    setLocation(next);
  }, []);

  const national = useMemo(
    () => resolveForYear(nationalHolidays, year),
    [nationalHolidays, year],
  );

  const regional = useMemo(
    () => resolveForYear(stateRegionalHolidays, year),
    [stateRegionalHolidays, year],
  );

  const contextHolidays = useMemo(() => {
    if (!location) return [];

    const stateHolidays = (stateHolidaysByUf[location.uf] ?? []).map((holiday) => ({
      ...holiday,
      state: location.uf,
    }));

    const cityHolidays = municipalHolidays.map((holiday) => ({
      ...holiday,
      state: location.uf,
      city: location.citySlug,
    }));

    return serializeUnique(resolveForYear([...stateHolidays, ...cityHolidays], year));
  }, [location, stateHolidaysByUf, municipalHolidays, year]);

  const activeHolidays = useMemo(() => {
    const base = location
      ? serializeUnique([...national, ...contextHolidays])
      : national;
    return filterHolidaysByCategory(base, selectedCategories);
  }, [location, national, contextHolidays, selectedCategories]);

  const hasLocation = Boolean(location);

  const locationPicker = (
    <LocationPicker
      states={states}
      location={location}
      onLocationChange={handleLocationChange}
      variant="header"
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {headerSlot && createPortal(locationPicker, headerSlot)}

      <div className="min-h-0 flex-1 pb-0">
        {!isCalendarReady ? (
          <CalendarSkeleton />
        ) : (
          <HolidayCalendar
            year={year}
            onYearChange={setYear}
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            nationalHolidays={national}
            regionalHolidays={regional}
            contextHolidays={contextHolidays}
            hasLocation={hasLocation}
            selectedCategories={selectedCategories}
            onCategoriesChange={handleCategoriesChange}
          />
        )}
      </div>

      {isCalendarReady && <FloatingCountdown holidays={activeHolidays} />}
    </div>
  );
}
