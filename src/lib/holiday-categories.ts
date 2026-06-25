import type { Holiday, HolidayCategory } from '@/data/schema';
import { HOLIDAY_CATEGORY_ORDER } from '@/lib/constants';

export function isHolidayCategory(value: unknown): value is HolidayCategory {
  return typeof value === 'string' && HOLIDAY_CATEGORY_ORDER.includes(value as HolidayCategory);
}

export function matchesCategoryFilter(
  holiday: Pick<Holiday, 'categories'>,
  selected: ReadonlySet<HolidayCategory>,
): boolean {
  if (selected.size === 0) return false;
  return holiday.categories.some((category) => selected.has(category));
}

export function filterHolidaysByCategory<T extends Pick<Holiday, 'categories'>>(
  holidays: T[],
  selected: ReadonlySet<HolidayCategory>,
): T[] {
  return holidays.filter((holiday) => matchesCategoryFilter(holiday, selected));
}

export function getAllHolidayCategories(): HolidayCategory[] {
  return [...HOLIDAY_CATEGORY_ORDER];
}

export function createAllCategoriesSet(): Set<HolidayCategory> {
  return new Set(HOLIDAY_CATEGORY_ORDER);
}
