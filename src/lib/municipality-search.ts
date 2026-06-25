import { normalizeText } from '@/lib/text';

export interface MunicipalityOption {
  slug: string;
  name: string;
  uf: string;
  anniversary?: string;
  holidayDates?: string[];
}

export interface StateOption {
  uf: string;
  name: string;
  slug: string;
  capital?: string;
}

export interface MunicipalitySearchResult {
  items: MunicipalityOption[];
  truncated: boolean;
  matchedStateUf?: string;
}

const RESULT_LIMIT = 50;

function compareMunicipalities(a: MunicipalityOption, b: MunicipalityOption): number {
  const byName = a.name.localeCompare(b.name, 'pt-BR');
  if (byName !== 0) return byName;
  return a.uf.localeCompare(b.uf, 'pt-BR');
}

function scoreCityMatch(cityName: string, query: string): number {
  const normalizedCity = normalizeText(cityName);
  if (normalizedCity === query) return 0;
  if (normalizedCity.startsWith(query)) return 1;
  if (normalizedCity.includes(query)) return 2;
  return 3;
}

function findMatchingStateUf(query: string, states: StateOption[]): string | undefined {
  if (query.length === 2) {
    const ufMatch = states.find((state) => normalizeText(state.uf) === query);
    if (ufMatch) return ufMatch.uf;
  }

  const byName = states.find((state) => normalizeText(state.name).includes(query));
  return byName?.uf;
}

export function searchMunicipalities(
  query: string,
  municipalities: MunicipalityOption[],
  states: StateOption[],
): MunicipalitySearchResult {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    const capitals = states
      .map((state) => {
        if (!state.capital) return undefined;
        const capitalName = state.capital;
        return municipalities.find(
          (municipality) =>
            municipality.uf === state.uf &&
            normalizeText(municipality.name) === normalizeText(capitalName),
        );
      })
      .filter((municipality): municipality is MunicipalityOption => Boolean(municipality));

    const uniqueCapitals = [...new Map(capitals.map((m) => [`${m.uf}/${m.slug}`, m])).values()];
    uniqueCapitals.sort(compareMunicipalities);

    return {
      items: uniqueCapitals.slice(0, RESULT_LIMIT),
      truncated: uniqueCapitals.length > RESULT_LIMIT,
    };
  }

  const matchedStateUf = findMatchingStateUf(normalizedQuery, states);
  if (matchedStateUf) {
    const stateCities = municipalities
      .filter((municipality) => municipality.uf === matchedStateUf)
      .sort(compareMunicipalities);
    return {
      items: stateCities.slice(0, RESULT_LIMIT),
      truncated: stateCities.length > RESULT_LIMIT,
      matchedStateUf,
    };
  }

  const ranked = municipalities
    .map((municipality) => ({
      municipality,
      score: scoreCityMatch(municipality.name, normalizedQuery),
    }))
    .filter((entry) => entry.score < 3)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return compareMunicipalities(a.municipality, b.municipality);
    })
    .map((entry) => entry.municipality);

  return {
    items: ranked.slice(0, RESULT_LIMIT),
    truncated: ranked.length > RESULT_LIMIT,
  };
}
