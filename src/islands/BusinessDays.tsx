import { useEffect, useState } from 'preact/hooks';
import { loadIndex, search, type CityEntry, type SearchIndex } from './search-core';

interface Result {
  dias_uteis: number;
  dias_corridos: number;
  feriados_em_dias_uteis: { data: string; dia_semana: string; nome: string }[];
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function BusinessDays({ today }: { today: string }) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(addDays(today, 30));
  const [optional, setOptional] = useState(false);
  const [city, setCity] = useState<CityEntry | null>(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  const suggestions = index && query && !city ? search(index, query, 6).filter((r) => r.type === 'city') : [];

  useEffect(() => {
    if (!start || !end) return;
    const params = new URLSearchParams({ inicio: start, fim: end });
    if (city) params.set('ibge', String(city.ibge));
    if (optional) params.set('facultativos', '1');
    const controller = new AbortController();
    fetch(`/api/v1/dias-uteis/?${params}`, { signal: controller.signal })
      .then(async (r) => {
        const body = (await r.json()) as Result & { erro?: string };
        if (!r.ok) throw new Error(body.erro ?? 'Erro');
        setResult(body);
        setError('');
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Erro ao calcular');
      });
    return () => controller.abort();
  }, [start, end, optional, city]);

  return (
    <div class="card p-5 sm:p-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-medium">
          Data inicial
          <input type="date" class="input mt-1.5" value={start} onInput={(e) => setStart(e.currentTarget.value)} />
        </label>
        <label class="text-sm font-medium">
          Data final
          <input type="date" class="input mt-1.5" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
        </label>
        <div class="relative sm:col-span-2">
          <label class="text-sm font-medium" for="bd-city">
            Cidade <span class="font-normal text-faint">(opcional — inclui feriados estaduais e municipais)</span>
          </label>
          {city ? (
            <div class="mt-1.5 flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
              <span>
                {city.name} · {city.uf}
              </span>
              <button type="button" class="text-faint hover:text-fg" onClick={() => setCity(null)}>
                trocar
              </button>
            </div>
          ) : (
            <input
              id="bd-city"
              class="input mt-1.5"
              placeholder="Todo o Brasil (apenas feriados nacionais)"
              value={query}
              onFocus={() => void loadIndex().then(setIndex).catch(() => undefined)}
              onInput={(e) => setQuery(e.currentTarget.value)}
              autocomplete="off"
            />
          )}
          {suggestions.length > 0 && (
            <ul class="card absolute z-10 mt-1 w-full p-1">
              {suggestions.map((s) =>
                s.type === 'city' ? (
                  <li key={s.item.ibge}>
                    <button
                      type="button"
                      class="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-subtle"
                      onClick={() => {
                        setCity(s.item);
                        setQuery('');
                      }}
                    >
                      {s.item.name} <span class="text-faint">· {s.item.uf}</span>
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>
        <label class="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.currentTarget.checked)} />
          Descontar também pontos facultativos (Carnaval, Corpus Christi…)
        </label>
      </div>

      <div class="mt-6 border-t border-line pt-6" aria-live="polite">
        {error && <p class="text-sm text-[var(--color-warn)]">{error}</p>}
        {result && !error && (
          <div>
            <p class="text-sm text-muted">Dias úteis no período</p>
            <p class="tabular text-5xl font-semibold tracking-tight">{result.dias_uteis}</p>
            <p class="mt-1 text-sm text-faint">
              de {result.dias_corridos} dias corridos
              {result.feriados_em_dias_uteis.length > 0 && `, descontando ${result.feriados_em_dias_uteis.length} feriado(s) em dia de semana`}
            </p>
            {result.feriados_em_dias_uteis.length > 0 && (
              <ul class="mt-4 space-y-1 text-sm">
                {result.feriados_em_dias_uteis.map((f) => (
                  <li key={f.data} class="flex justify-between gap-3">
                    <span>{f.nome}</span>
                    <span class="tabular text-faint">
                      {f.data.split('-').reverse().join('/')} · {f.dia_semana}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
