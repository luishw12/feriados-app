import type { APIContext } from 'astro';
import { getCityByIbge, getCity, getState, getHolidaysFor, getOverridesFor, toDef, type Place } from './data';
import type { Occurrence } from './holidays/resolve';
import { weekdayName } from './holidays/rules';
import { cachePage } from './cache';
import { paths, placeLabel, typeLabel } from './site';

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
};

export function json(ctx: APIContext, data: unknown, init: { status?: number; tags?: string[] } = {}): Response {
  if (init.status === undefined || init.status < 400) cachePage(ctx, init.tags ?? ['national']);
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}

export function apiError(ctx: APIContext, status: number, message: string): Response {
  return json(ctx, { erro: message }, { status });
}

/** Lê ?uf=SP, ?ibge=3509502 ou ?cidade=campinas&uf=SP. */
export async function placeFromQuery(url: URL): Promise<{ place: Place; error?: string }> {
  const uf = url.searchParams.get('uf');
  const ibge = url.searchParams.get('ibge');
  const slug = url.searchParams.get('cidade');
  if (ibge) {
    const city = /^\d{7}$/.test(ibge) ? await getCityByIbge(Number(ibge)) : null;
    if (!city) return { place: { state: null, city: null }, error: 'Código IBGE não encontrado' };
    return { place: { state: await getState(city.uf), city } };
  }
  if (uf) {
    const state = await getState(uf);
    if (!state) return { place: { state: null, city: null }, error: 'UF inválida' };
    if (slug) {
      const city = await getCity(state.uf, slug);
      if (!city) return { place: { state: null, city: null }, error: 'Cidade não encontrada' };
      return { place: { state, city } };
    }
    return { place: { state, city: null } };
  }
  return { place: { state: null, city: null } };
}

export async function defsFor(place: Place) {
  const rows = await getHolidaysFor({ uf: place.state?.uf ?? null, ibge: place.city?.ibge ?? null });
  const overrides = await getOverridesFor(rows.filter((r) => r.scope !== 'national').map((r) => r.id));
  return { defs: rows.map(toDef), overrides };
}

export function placeTags(place: Place): string[] {
  const tags = ['national', 'api'];
  if (place.state) tags.push(`uf:${place.state.uf}`);
  if (place.city) tags.push(`city:${place.city.ibge}`);
  return tags;
}

export function placeJson(place: Place) {
  return {
    nome: placeLabel(place),
    uf: place.state?.uf ?? null,
    estado: place.state?.name ?? null,
    ibge: place.city?.ibge ?? null,
    cidade: place.city?.name ?? null,
  };
}

export function occurrenceJson(o: Occurrence, site: URL) {
  return {
    data: o.date,
    dia_semana: weekdayName(o.date),
    nome: o.name,
    id: o.id,
    tipo: o.kind,
    abrangencia: o.scope,
    descricao_tipo: typeLabel(o.scope, o.kind),
    uf: o.uf,
    ibge: o.ibge,
    regra: o.rule,
    base_legal: o.legalBasis || null,
    status: o.status,
    url: new URL(paths.holiday(o.id, Number(o.date.slice(0, 4))), site).href,
  };
}
