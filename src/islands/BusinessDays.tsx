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
        <div>
          <label class="field-label" for="bd-start">
            Data inicial
          </label>
          <input id="bd-start" type="date" class="input" value={start} onInput={(e) => setStart(e.currentTarget.value)} />
        </div>
        <div>
          <label class="field-label" for="bd-end">
            Data final
          </label>
          <input id="bd-end" type="date" class="input" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
        </div>
        <div class="relative sm:col-span-2">
          <label class="field-label" for="bd-city">
            Cidade <span class="font-normal text-faint">(opcional — inclui feriados estaduais e municipais)</span>
          </label>
          {city ? (
            <div class="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line-strong bg-surface py-1.5 pr-1.5 pl-3.5 text-sm shadow-[var(--shadow-card)]">
              <span class="font-medium">
                {city.name} · {city.uf}
              </span>
              <button type="button" id="bd-city" class="btn px-3 py-1 text-xs" onClick={() => setCity(null)}>
                Trocar
              </button>
            </div>
          ) : (
            <input
              id="bd-city"
              class="input"
              placeholder="Todo o Brasil (apenas feriados nacionais)"
              value={query}
              onFocus={() => void loadIndex().then(setIndex).catch(() => undefined)}
              onInput={(e) => setQuery(e.currentTarget.value)}
              autocomplete="off"
            />
          )}
          {suggestions.length > 0 && (
            <ul class="popover inset-x-0">
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
        <label class="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
          <input type="checkbox" class="checkbox" checked={optional} onChange={(e) => setOptional(e.currentTarget.checked)} />
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
