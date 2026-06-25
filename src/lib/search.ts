import { normalizeText } from '@/lib/text';
import type { HolidayType } from '@/data/schema';

export interface SearchIndexEntry {
  id: string;
  name: string;
  type: HolidayType;
  dayNum: number;
  weekdayShort: string;
  scopeLabel: string;
  snippet: string;
  searchText: string;
}

const DEFAULT_LIMIT = 8;

function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function scoreEntry(entry: SearchIndexEntry, tokens: string[]): number {
  const normalizedName = normalizeText(entry.name);
  let score = 0;

  for (const token of tokens) {
    if (!entry.searchText.includes(token)) return -1;
    if (normalizedName === token) score += 100;
    else if (normalizedName.startsWith(token)) score += 50;
    else if (normalizedName.includes(token)) score += 25;
    else score += 5;
  }

  return score;
}

export function searchHolidays(
  entries: SearchIndexEntry[],
  query: string,
  limit = DEFAULT_LIMIT,
): SearchIndexEntry[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter((result) => result.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.entry.name.localeCompare(b.entry.name, 'pt-BR');
    })
    .slice(0, limit)
    .map((result) => result.entry);
}

export function truncateSnippet(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
