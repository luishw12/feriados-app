import nationalHolidays from '@/data/holidays/national.json';
import commemorativeHolidays from '@/data/holidays/commemorative.json';
import statesData from '@/data/states.json';
import { resolveHolidayDate } from '@/lib/dates';
import { isHolidayCategory } from '@/lib/holiday-categories';
import type {
  Holiday,
  HolidayDefinition,
  HolidayScope,
  MunicipalityHolidayFile,
  ResolvedHoliday,
  SerializedResolvedHoliday,
  StateHolidayFile,
  StateInfo,
} from '@/data/schema';

const stateFiles = import.meta.glob<{ default: StateHolidayFile }>(
  '../data/holidays/states/*.json',
  { eager: true },
);

const municipalityFiles = import.meta.glob<{ default: MunicipalityHolidayFile }>(
  '../data/holidays/municipalities/**/*.json',
  { eager: true },
);

function isHoliday(value: unknown): value is Holiday {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.type === 'string' &&
    (typeof record.date === 'string' || typeof record.dateRule === 'string') &&
    Array.isArray(record.categories) &&
    record.categories.length >= 1 &&
    record.categories.every(isHolidayCategory)
  );
}

function assertHolidayCategories(holidays: Holiday[], source: string): void {
  for (const holiday of holidays) {
    if (!holiday.categories || holiday.categories.length === 0) {
      throw new Error(`Holiday "${holiday.id}" in ${source} is missing categories`);
    }
    for (const category of holiday.categories) {
      if (!isHolidayCategory(category)) {
        throw new Error(
          `Holiday "${holiday.id}" in ${source} has invalid category: ${String(category)}`,
        );
      }
    }
  }
}

function validateAllHolidayData(): void {
  assertHolidayCategories(nationalHolidays as Holiday[], 'national.json');
  assertHolidayCategories(commemorativeHolidays as Holiday[], 'commemorative.json');

  for (const [path, module] of Object.entries(stateFiles)) {
    const data = module.default;
    if (!isStateHolidayFile(data)) {
      throw new Error(`Invalid state holiday file: ${path}`);
    }
    assertHolidayCategories(data.holidays, path);
  }

  for (const [path, module] of Object.entries(municipalityFiles)) {
    const data = module.default;
    if (!isMunicipalityHolidayFile(data)) {
      throw new Error(`Invalid municipality holiday file: ${path}`);
    }
    assertHolidayCategories(data.holidays, path);
  }
}

validateAllHolidayData();

function isStateHolidayFile(value: unknown): value is StateHolidayFile {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.uf === 'string' &&
    typeof record.name === 'string' &&
    typeof record.slug === 'string' &&
    Array.isArray(record.holidays) &&
    record.holidays.every(isHoliday)
  );
}

function isMunicipalityHolidayFile(value: unknown): value is MunicipalityHolidayFile {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.ibgeCode === 'number' &&
    typeof record.name === 'string' &&
    typeof record.slug === 'string' &&
    typeof record.uf === 'string' &&
    Array.isArray(record.holidays) &&
    record.holidays.every(isHoliday)
  );
}

function getStateFile(uf: string): StateHolidayFile | null {
  const key = Object.keys(stateFiles).find((entry) => entry.endsWith(`/${uf}.json`));
  if (!key) return null;
  const module = stateFiles[key];
  if (!module) return null;
  const data = module.default;
  if (!isStateHolidayFile(data)) return null;
  return data;
}

function getMunicipalityFile(uf: string, citySlug: string): MunicipalityHolidayFile | null {
  const key = Object.keys(municipalityFiles).find(
    (entry) => entry.includes(`/${uf}/`) && entry.endsWith(`/${citySlug}.json`),
  );
  if (!key) return null;
  const module = municipalityFiles[key];
  if (!module) return null;
  const data = module.default;
  if (!isMunicipalityHolidayFile(data)) return null;
  return data;
}

function resolveHolidays(
  holidays: Holiday[],
  year: number,
  context?: { state?: string; city?: string },
): ResolvedHoliday[] {
  return holidays.map((holiday) => ({
    ...holiday,
    resolvedDate: resolveHolidayDate(holiday, year),
    ...(context?.state ? { state: context.state } : {}),
    ...(context?.city ? { city: context.city } : {}),
  }));
}

export function getAllNationalHolidays(year: number): ResolvedHoliday[] {
  return resolveHolidays(nationalHolidays as Holiday[], year);
}

export function getAllCommemorativeHolidays(year: number): ResolvedHoliday[] {
  return resolveHolidays(commemorativeHolidays as Holiday[], year);
}

export function getAllNationalCalendarEvents(year: number): ResolvedHoliday[] {
  return [...getAllNationalHolidays(year), ...getAllCommemorativeHolidays(year)].sort(
    (a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime(),
  );
}

export function getHolidaysByState(uf: string, year: number): ResolvedHoliday[] {
  const file = getStateFile(uf);
  if (!file) return [];
  return resolveHolidays(file.holidays, year, { state: uf });
}

export function getHolidaysByCity(uf: string, citySlug: string, year: number): ResolvedHoliday[] {
  const file = getMunicipalityFile(uf, citySlug);
  if (!file) return [];
  return resolveHolidays(file.holidays, year, { state: uf, city: citySlug });
}

export function getAllRegionalHolidays(year: number): ResolvedHoliday[] {
  const stateHolidays = getAllStates().flatMap((state) => getHolidaysByState(state.uf, year));
  const municipalHolidays = getAllMunicipalities().flatMap((municipality) =>
    getHolidaysByCity(municipality.uf, municipality.slug, year),
  );
  return [...stateHolidays, ...municipalHolidays];
}

export function getAllHolidaysForContext(
  year: number,
  uf?: string,
  citySlug?: string,
): ResolvedHoliday[] {
  const national = getAllNationalCalendarEvents(year);
  const state = uf ? getHolidaysByState(uf, year) : [];
  const municipal = uf && citySlug ? getHolidaysByCity(uf, citySlug, year) : [];
  return [...national, ...state, ...municipal].sort(
    (a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime(),
  );
}

export function getNextHoliday(holidays: ResolvedHoliday[]): ResolvedHoliday | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return holidays.find((holiday) => holiday.resolvedDate >= now) ?? null;
}

export function getHolidaysForMonth(
  holidays: ResolvedHoliday[],
  year: number,
  month: number,
): ResolvedHoliday[] {
  return holidays.filter(
    (holiday) =>
      holiday.resolvedDate.getFullYear() === year && holiday.resolvedDate.getMonth() === month,
  );
}

export function getAllStates(): StateInfo[] {
  return statesData as StateInfo[];
}

export function getStateBySlug(slug: string): StateInfo | undefined {
  return getAllStates().find((state) => state.slug === slug);
}

export function getStateByUf(uf: string): StateInfo | undefined {
  return getAllStates().find((state) => state.uf === uf);
}

export function getAllMunicipalities(): MunicipalityHolidayFile[] {
  return Object.values(municipalityFiles)
    .map((module) => module.default)
    .filter(isMunicipalityHolidayFile);
}

export function getMunicipalitiesByState(uf: string): MunicipalityHolidayFile[] {
  return getAllMunicipalities()
    .filter((municipality) => municipality.uf === uf)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function serializeHolidays(holidays: ResolvedHoliday[]): SerializedResolvedHoliday[] {
  return holidays.map((holiday) => ({
    ...holiday,
    resolvedDate: holiday.resolvedDate.toISOString(),
  }));
}

export function deserializeHolidays(holidays: SerializedResolvedHoliday[]): ResolvedHoliday[] {
  return holidays.map((holiday) => ({
    ...holiday,
    resolvedDate: new Date(holiday.resolvedDate),
  }));
}

export function getAllMunicipalityPaths(): Array<{
  state: StateInfo;
  municipality: MunicipalityHolidayFile;
}> {
  return getAllMunicipalities().flatMap((municipality) => {
    const state = getStateByUf(municipality.uf);
    if (!state) return [];
    return [{ state, municipality }];
  });
}

function scopeKey(scope: HolidayScope): string {
  return [
    scope.type,
    scope.uf ?? '',
    scope.citySlug ?? '',
  ].join(':');
}

function addScope(map: Map<string, HolidayDefinition>, holiday: Holiday, scope: HolidayScope): void {
  const existing = map.get(holiday.id);
  if (existing) {
    const hasScope = existing.scopes.some((entry) => scopeKey(entry) === scopeKey(scope));
    if (!hasScope) existing.scopes.push(scope);
    return;
  }

  map.set(holiday.id, {
    ...holiday,
    scopes: [scope],
  });
}

export function getAllHolidayDefinitions(): HolidayDefinition[] {
  const map = new Map<string, HolidayDefinition>();

  for (const holiday of nationalHolidays as Holiday[]) {
    addScope(map, holiday, { type: holiday.type });
  }

  for (const holiday of commemorativeHolidays as Holiday[]) {
    addScope(map, holiday, { type: holiday.type });
  }

  for (const module of Object.values(stateFiles)) {
    const data = module.default;
    if (!isStateHolidayFile(data)) continue;
    const state = getStateByUf(data.uf);
    for (const holiday of data.holidays) {
      addScope(map, holiday, {
        type: holiday.type,
        uf: data.uf,
        stateSlug: data.slug,
        stateName: state?.name ?? data.name,
      });
    }
  }

  for (const module of Object.values(municipalityFiles)) {
    const data = module.default;
    if (!isMunicipalityHolidayFile(data)) continue;
    const state = getStateByUf(data.uf);
    for (const holiday of data.holidays) {
      const scope: HolidayScope = {
        type: holiday.type,
        uf: data.uf,
        citySlug: data.slug,
        cityName: data.name,
      };
      if (state?.slug) scope.stateSlug = state.slug;
      if (state?.name) scope.stateName = state.name;
      addScope(map, holiday, scope);
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function getHolidayDefinitionById(id: string): HolidayDefinition | null {
  return getAllHolidayDefinitions().find((holiday) => holiday.id === id) ?? null;
}

export function resolveHolidayForYear(holiday: Holiday, year: number): ResolvedHoliday {
  return {
    ...holiday,
    resolvedDate: resolveHolidayDate(holiday, year),
  };
}

export function getHolidayScopeLabel(definition: HolidayDefinition): string {
  const municipal = definition.scopes.find((scope) => scope.cityName && scope.uf);
  if (municipal?.cityName && municipal.uf) {
    return `Feriado municipal — ${municipal.cityName}/${municipal.uf}`;
  }

  const state = definition.scopes.find((scope) => scope.stateName && scope.uf);
  if (state?.stateName) {
    return `Feriado estadual — ${state.stateName}`;
  }

  if (definition.type === 'commemorative') return 'Data comemorativa nacional';
  if (definition.type === 'optional') return 'Feriado facultativo nacional';
  if (definition.type === 'national') return 'Feriado nacional';
  return 'Feriado no Brasil';
}
