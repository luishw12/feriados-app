import { useMemo, useState } from 'react';
import { normalizeText } from '@/lib/text';

interface CityLink {
  name: string;
  slug: string;
  href: string;
}

interface Props {
  cities: CityLink[];
  stateName: string;
}

export default function StateCityFilter({ cities, stateName }: Props) {
  const [query, setQuery] = useState('');

  const filteredCities = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return cities;
    return cities.filter((city) => normalizeText(city.name).includes(normalizedQuery));
  }, [cities, query]);

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Buscar cidade em {stateName}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite o nome da cidade..."
          className="w-full max-w-md rounded-lg border bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {filteredCities.length} de {cities.length} cidades
      </p>

      <ul className="flex max-h-80 flex-wrap gap-2 overflow-y-auto">
        {filteredCities.map((city) => (
          <li key={city.slug}>
            <a
              href={city.href}
              className="inline-flex rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors duration-150 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
            >
              {city.name}
            </a>
          </li>
        ))}
      </ul>

      {filteredCities.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Nenhuma cidade encontrada para &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
