import type { HolidayCategory } from '@/data/schema';
import { HOLIDAY_CATEGORY_ORDER } from '@/lib/constants';
import { isHolidayCategory } from '@/lib/holiday-categories';

const STORAGE_KEY = 'holiday-category-filters';

function parseStoredCategories(raw: string): Set<HolidayCategory> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const categories = parsed.filter(isHolidayCategory);
    if (categories.length === 0) return null;
    return new Set(categories);
  } catch {
    return null;
  }
}

export function loadStoredCategoryFilters(): Set<HolidayCategory> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseStoredCategories(raw);
  } catch {
    return null;
  }
}

export function saveStoredCategoryFilters(selected: ReadonlySet<HolidayCategory>): void {
  if (typeof window === 'undefined') return;
  try {
    const ordered = HOLIDAY_CATEGORY_ORDER.filter((category) => selected.has(category));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
  } catch {
    // localStorage bloqueado — preferência não persiste
  }
}

export function getDefaultCategoryFilters(): Set<HolidayCategory> {
  return new Set(HOLIDAY_CATEGORY_ORDER);
}

export function getInitialCategoryFilters(): Set<HolidayCategory> {
  return loadStoredCategoryFilters() ?? getDefaultCategoryFilters();
}
