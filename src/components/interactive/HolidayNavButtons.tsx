import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveHolidayDate } from '@/lib/dates';
import {
  loadStoredLocationContext,
  subscribeLocationUpdated,
  type LocationContext,
} from '@/lib/location-storage';

export interface NavHoliday {
  id: string;
  name: string;
  date?: string;
  dateRule?: string;
  /** Aplica-se em todo o país (feriado nacional/comemorativo). */
  national: boolean;
  /** UFs em que vale como feriado estadual. */
  ufs: string[];
  /** Slugs de cidades em que vale como feriado municipal. */
  citySlugs: string[];
}

interface Props {
  currentId: string;
  year: number;
  holidays: NavHoliday[];
}

function appliesToLocation(holiday: NavHoliday, location: LocationContext | null): boolean {
  if (holiday.national) return true;
  if (!location) return false;
  if (location.uf && holiday.ufs.includes(location.uf)) return true;
  if (location.citySlug && holiday.citySlugs.includes(location.citySlug)) return true;
  return false;
}

function resolveTimestamp(holiday: NavHoliday, year: number): number {
  try {
    return resolveHolidayDate(holiday, year).getTime();
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export default function HolidayNavButtons({ currentId, year, holidays }: Props) {
  // Inicia null para casar com o HTML renderizado no servidor (sem localStorage)
  // e só então lê a localização salva, evitando divergência de hidratação.
  const [location, setLocation] = useState<LocationContext | null>(null);

  useEffect(() => {
    setLocation(loadStoredLocationContext());
    return subscribeLocationUpdated(() => setLocation(loadStoredLocationContext()));
  }, []);

  const { previous, next } = useMemo(() => {
    // Feriados relevantes à localização do usuário, mais o que está aberto,
    // ordenados pela data em que ocorrem no ano corrente.
    const relevant = holidays.filter(
      (holiday) => holiday.id === currentId || appliesToLocation(holiday, location),
    );

    const ordered = relevant
      .map((holiday) => ({ holiday, timestamp: resolveTimestamp(holiday, year) }))
      .sort((a, b) =>
        a.timestamp !== b.timestamp
          ? a.timestamp - b.timestamp
          : a.holiday.name.localeCompare(b.holiday.name, 'pt-BR'),
      )
      .map((entry) => entry.holiday);

    const index = ordered.findIndex((holiday) => holiday.id === currentId);
    if (index === -1) return { previous: null, next: null };

    return {
      previous: index > 0 ? ordered[index - 1] : null,
      next: index < ordered.length - 1 ? ordered[index + 1] : null,
    };
  }, [holidays, location, currentId, year]);

  const enabledClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors duration-150 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400';
  const disabledClass =
    'inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-700';

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {previous ? (
        <a
          href={`/feriado/${previous.id}/`}
          title="Último feriado"
          aria-label={`Último feriado: ${previous.name}`}
          className={enabledClass}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </a>
      ) : (
        <span className={disabledClass} aria-hidden="true">
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}
      {next ? (
        <a
          href={`/feriado/${next.id}/`}
          title="Próximo feriado"
          aria-label={`Próximo feriado: ${next.name}`}
          className={enabledClass}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </a>
      ) : (
        <span className={disabledClass} aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}
