import type { Holiday, HolidayCategory } from '@/data/schema';
import type { MunicipalityOption } from '@/lib/municipality-search';

const INDEX_URL = '/data/municipalities-index.json';

let cachedIndex: MunicipalityOption[] | null = null;
let loadPromise: Promise<MunicipalityOption[]> | null = null;

function isMunicipalityOption(value: unknown): value is MunicipalityOption {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.slug === 'string' &&
    typeof record.name === 'string' &&
    typeof record.uf === 'string' &&
    (record.anniversary === undefined || typeof record.anniversary === 'string') &&
    (record.holidayDates === undefined ||
      (Array.isArray(record.holidayDates) &&
        record.holidayDates.every((entry) => typeof entry === 'string')))
  );
}

export async function loadMunicipalityIndex(): Promise<MunicipalityOption[]> {
  if (cachedIndex) return cachedIndex;
  if (loadPromise) return loadPromise;

  loadPromise = fetch(INDEX_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load municipality index: ${response.status}`);
      }
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(isMunicipalityOption)) {
        throw new Error('Invalid municipality index format');
      }
      cachedIndex = data;
      return data;
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

export function findMunicipalityInIndex(
  municipalities: MunicipalityOption[],
  uf: string,
  citySlug: string,
): MunicipalityOption | undefined {
  return municipalities.find(
    (municipality) => municipality.uf === uf && municipality.slug === citySlug,
  );
}

export function buildMunicipalHolidaysFromIndex(
  municipality: MunicipalityOption,
): Holiday[] {
  const dates = municipality.holidayDates ?? (
    municipality.anniversary ? [municipality.anniversary] : []
  );

  return dates.map((date, index) => {
    const dateKey = date.replace('-', '');
    const isPrimary = index === 0;
    return {
      id: isPrimary
        ? `aniversario-${municipality.slug}`
        : `feriado-municipal-${municipality.slug}-${dateKey}`,
      name: isPrimary
        ? `Aniversário de ${municipality.name}`
        : `Feriado Municipal de ${municipality.name}`,
      date,
      type: 'municipal' as const,
      description: isPrimary
        ? 'Feriado municipal — aniversário da cidade.'
        : 'Feriado municipal local.',
      categories: ['historico', 'civico'] satisfies HolidayCategory[],
    };
  });
}
