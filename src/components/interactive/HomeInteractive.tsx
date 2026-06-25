import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SerializedResolvedHoliday } from '@/data/schema';
import { resolveHolidayDate } from '@/lib/dates';
import type { Holiday } from '@/data/schema';
import LocationPicker, { type LocationContext } from '@/components/interactive/LocationPicker';
import FloatingCountdown from '@/components/interactive/FloatingCountdown';
import HolidayCalendar from '@/components/interactive/HolidayCalendar';
import CalendarSkeleton from '@/components/interactive/CalendarSkeleton';
import { detectUserLocation, hasGeolocationPermission } from '@/lib/geolocation';
import { findMunicipalityByName } from '@/lib/municipality-match';
import { loadStoredLocationContext } from '@/lib/location-storage';

interface StateOption {
  uf: string;
  name: string;
  slug: string;
}

interface MunicipalityOption {
  slug: string;
  name: string;
  uf: string;
}

interface RawHoliday extends Holiday {
  state?: string;
  city?: string;
}

interface Props {
  initialYear: number;
  states: StateOption[];
  municipalities: MunicipalityOption[];
  nationalHolidays: Holiday[];
  stateHolidaysByUf: Record<string, Holiday[]>;
  municipalHolidaysByKey: Record<string, Holiday[]>;
  allRegionalHolidays: Holiday[];
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

function buildContextFromDetection(
  result: { uf: string; stateName: string; stateSlug: string; cityName?: string },
  municipalities: MunicipalityOption[],
): LocationContext {
  const city = result.cityName
    ? findMunicipalityByName(result.cityName, result.uf, municipalities)
    : undefined;

  const context: LocationContext = {
    uf: result.uf,
    stateName: result.stateName,
    stateSlug: result.stateSlug,
  };

  if (city) {
    context.citySlug = city.slug;
    context.cityName = city.name;
  }

  return context;
}

export default function HomeInteractive({
  initialYear,
  states,
  municipalities,
  nationalHolidays,
  stateHolidaysByUf,
  municipalHolidaysByKey,
  allRegionalHolidays,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

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
    if (isCalendarReady) return undefined;

    let cancelled = false;

    void (async () => {
      const granted = await hasGeolocationPermission();
      if (!granted) {
        if (!cancelled) setIsCalendarReady(true);
        return;
      }

      const result = await detectUserLocation();
      if (!cancelled && result) {
        setLocation(buildContextFromDetection(result, municipalities));
      }
      if (!cancelled) setIsCalendarReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isCalendarReady, municipalities]);

  const handleLocationChange = useCallback((next: LocationContext | null) => {
    setLocation(next);
  }, []);

  const national = useMemo(
    () => resolveForYear(nationalHolidays, year),
    [nationalHolidays, year],
  );

  const regional = useMemo(
    () => resolveForYear(allRegionalHolidays, year),
    [allRegionalHolidays, year],
  );

  const contextHolidays = useMemo(() => {
    if (!location) return [];

    const stateHolidays = (stateHolidaysByUf[location.uf] ?? []).map((h) => ({
      ...h,
      state: location.uf,
    }));

    const cityKey = location.citySlug ? `${location.uf}/${location.citySlug}` : '';
    const cityHolidays = cityKey
      ? (municipalHolidaysByKey[cityKey] ?? []).map((h) => ({
          ...h,
          state: location.uf,
          city: location.citySlug,
        }))
      : [];

    return serializeUnique(resolveForYear([...stateHolidays, ...cityHolidays], year));
  }, [location, stateHolidaysByUf, municipalHolidaysByKey, year]);

  const activeHolidays = useMemo(() => {
    if (location) {
      return serializeUnique([...national, ...contextHolidays]);
    }
    return national;
  }, [location, national, contextHolidays]);

  const hasLocation = Boolean(location);

  const locationPicker = (
    <LocationPicker
      states={states}
      municipalities={municipalities}
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
          />
        )}
      </div>

      {isCalendarReady && <FloatingCountdown holidays={activeHolidays} />}
    </div>
  );
}
