/** Índice e ranking da busca — compartilhado entre o diálogo e a calculadora. */
export interface CityEntry {
  ibge: number;
  name: string;
  uf: string;
  slug: string;
  capital: boolean;
  norm: string;
}

export interface HolidayEntry {
  id: string;
  name: string;
  label: string;
  norm: string;
}

export interface StateEntry {
  uf: string;
  name: string;
  norm: string;
}

export interface SearchIndex {
  cities: CityEntry[];
  holidays: HolidayEntry[];
  states: StateEntry[];
}

type RawIndex = {
  c: [number, string, string, string, 0 | 1][];
  h: [string, string, string][];
  s: [string, string][];
};

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let pending: Promise<SearchIndex> | undefined;

export function loadIndex(): Promise<SearchIndex> {
  pending ??= fetch('/api/search-index.json')
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<RawIndex>;
    })
    .then((raw) => ({
      cities: raw.c.map(([ibge, name, uf, slug, capital]) => ({ ibge, name, uf, slug, capital: capital === 1, norm: normalize(name) })),
      holidays: raw.h.map(([id, name, label]) => ({ id, name, label, norm: normalize(name) })),
      states: raw.s.map(([uf, name]) => ({ uf, name, norm: normalize(name) })),
    }))
    .catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
  return pending;
}

function score(norm: string, q: string): number {
  if (norm === q) return 100;
  if (norm.startsWith(q)) return 80;
  if (norm.includes(` ${q}`)) return 60;
  if (norm.includes(q)) return 30;
  return 0;
}

export type SearchResult =
  | { type: 'city'; item: CityEntry; score: number }
  | { type: 'state'; item: StateEntry; score: number }
  | { type: 'holiday'; item: HolidayEntry; score: number };

export function search(index: SearchIndex, query: string, limit = 10): SearchResult[] {
  const raw = normalize(query);
  if (!raw) return [];
  // "campinas sp" / "campinas - sp": filtra pela UF no fim da busca
  const ufMatch = /^(.*?)\s+([a-z]{2})$/.exec(raw);
  const ufFilter = ufMatch && index.states.some((s) => s.uf.toLowerCase() === ufMatch[2]) ? ufMatch[2]!.toUpperCase() : null;
  const q = ufFilter ? ufMatch![1]! : raw;

  const results: SearchResult[] = [];
  for (const s of index.states) {
    const sc = Math.max(score(s.norm, q), s.uf.toLowerCase() === q ? 95 : 0);
    if (sc) results.push({ type: 'state', item: s, score: sc + 5 });
  }
  for (const c of index.cities) {
    if (ufFilter && c.uf !== ufFilter) continue;
    const sc = score(c.norm, q);
    if (sc) results.push({ type: 'city', item: c, score: sc + (c.capital ? 8 : 0) - c.name.length / 100 });
  }
  if (!ufFilter) {
    for (const h of index.holidays) {
      const sc = score(h.norm, q);
      if (sc) results.push({ type: 'holiday', item: h, score: sc + 2 });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function resultHref(result: SearchResult): string {
  switch (result.type) {
    case 'city':
      return `/${result.item.uf.toLowerCase()}/${result.item.slug}/`;
    case 'state':
      return `/${result.item.uf.toLowerCase()}/`;
    case 'holiday':
      return `/feriado/${result.item.id}/`;
  }
}

/** Lugar escolhido num formulário (feriado nacional, estadual ou municipal). */
export type Place = { kind: 'national' } | { kind: 'state'; uf: string; name: string } | { kind: 'city'; ibge: number; name: string; uf: string };
export type PlaceKind = Place['kind'];

const NATIONAL_WORDS = ['nacional', 'brasil', 'todo o brasil', 'pais'];

/** Busca só lugares (sem feriados), respeitando os tipos permitidos. */
export function searchPlaces(index: SearchIndex, query: string, allow: readonly PlaceKind[], limit = 8): Place[] {
  const q = normalize(query);
  const places: Place[] = [];
  if (allow.includes('national') && (!q || NATIONAL_WORDS.some((w) => w.startsWith(q) || q.startsWith(w)))) places.push({ kind: 'national' });
  if (!q) {
    if (allow.includes('state')) places.push(...index.states.map((s): Place => ({ kind: 'state', uf: s.uf, name: s.name })));
    return places;
  }
  for (const r of search(index, query, limit * 4)) {
    if (r.type === 'state' && allow.includes('state')) places.push({ kind: 'state', uf: r.item.uf, name: r.item.name });
    if (r.type === 'city' && allow.includes('city')) places.push({ kind: 'city', ibge: r.item.ibge, name: r.item.name, uf: r.item.uf });
  }
  return places.slice(0, limit);
}

export function placeKey(place: Place): string {
  return place.kind === 'national' ? 'BR' : place.kind === 'state' ? place.uf : String(place.ibge);
}

export function placeText(place: Place): string {
  if (place.kind === 'national') return 'Nacional (todo o Brasil)';
  return place.kind === 'state' ? place.name : `${place.name} · ${place.uf}`;
}
