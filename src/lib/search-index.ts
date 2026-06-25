import type { HolidayArticle, HolidayDefinition } from '@/data/schema';
import { getArticleById } from '@/lib/articles';
import {
  getAllHolidayDefinitions,
  getHolidayScopeLabel,
  resolveHolidayForYear,
} from '@/lib/holidays';
import { normalizeText } from '@/lib/text';
import type { SearchIndexEntry } from '@/lib/search';

const DISPLAY_YEAR = new Date().getFullYear();

function collectArticleText(article: HolidayArticle): string[] {
  const parts: string[] = [article.lead];
  if (article.legalBasis) parts.push(article.legalBasis);
  parts.push(...article.history);
  if (article.traditions) parts.push(...article.traditions);
  if (article.funFacts) parts.push(...article.funFacts);
  return parts;
}

function collectScopeText(definition: HolidayDefinition): string[] {
  const parts: string[] = [];
  for (const scope of definition.scopes) {
    if (scope.stateName) parts.push(scope.stateName);
    if (scope.cityName) parts.push(scope.cityName);
    if (scope.uf) parts.push(scope.uf);
  }
  return parts;
}

function buildSnippet(definition: HolidayDefinition, article: HolidayArticle | null): string {
  if (article?.lead) return article.lead;
  if (definition.description) return definition.description;
  return '';
}

function buildSearchText(
  definition: HolidayDefinition,
  article: HolidayArticle | null,
  scopeLabel: string,
): string {
  const parts = [
    definition.name,
    definition.description ?? '',
    scopeLabel,
    ...collectScopeText(definition),
  ];
  if (article) parts.push(...collectArticleText(article));
  return normalizeText(parts.join(' '));
}

export function buildSearchIndex(): SearchIndexEntry[] {
  return getAllHolidayDefinitions().map((definition) => {
    const article = getArticleById(definition.id);
    const scopeLabel = getHolidayScopeLabel(definition);
    const snippet = buildSnippet(definition, article);
    const resolved = resolveHolidayForYear(definition, DISPLAY_YEAR);

    return {
      id: definition.id,
      name: definition.name,
      type: definition.type,
      dayNum: resolved.resolvedDate.getDate(),
      weekdayShort: resolved.resolvedDate.toLocaleDateString('pt-BR', { weekday: 'short' }),
      scopeLabel,
      snippet,
      searchText: buildSearchText(definition, article, scopeLabel),
    };
  });
}
