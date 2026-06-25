import type { HolidayArticle } from '@/data/schema';

const articleFiles = import.meta.glob<{ default: HolidayArticle }>('../data/articles/*.json', {
  eager: true,
});

function isHolidayArticle(value: unknown): value is HolidayArticle {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.lead === 'string' &&
    Array.isArray(record.history) &&
    record.history.length > 0 &&
    record.history.every((paragraph) => typeof paragraph === 'string')
  );
}

function getArticleMap(): Map<string, HolidayArticle> {
  const map = new Map<string, HolidayArticle>();

  for (const module of Object.values(articleFiles)) {
    const data = module.default;
    if (!isHolidayArticle(data)) continue;
    map.set(data.id, data);
  }

  return map;
}

export function getArticleById(id: string): HolidayArticle | null {
  return getArticleMap().get(id) ?? null;
}

export function getAllArticleIds(): string[] {
  return [...getArticleMap().keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function getAllArticles(): HolidayArticle[] {
  return [...getArticleMap().values()].sort((a, b) => a.id.localeCompare(b.id, 'pt-BR'));
}

/** Data fixa de publicação por artigo — estável entre builds. */
const ARTICLE_PUBLISHED_AT = '2025-06-01';

export function getArticlePublishedDate(_id: string): string {
  return ARTICLE_PUBLISHED_AT;
}

export function assertAllHolidaysHaveArticles(holidayIds: string[]): void {
  const missing = holidayIds.filter((id) => !getArticleById(id));
  if (missing.length > 0) {
    throw new Error(
      `Artigos ausentes para ${missing.length} feriado(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
    );
  }
}
