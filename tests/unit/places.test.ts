import { describe, expect, it } from 'vitest';
import { normalize, searchPlaces, type SearchIndex } from '../../src/islands/search-core';
import { suggestionInput } from '../../src/lib/server/suggestions';

const index: SearchIndex = {
  cities: [
    { ibge: 3509502, name: 'Campinas', uf: 'SP', slug: 'campinas', capital: false, norm: normalize('Campinas') },
    { ibge: 3550308, name: 'São Paulo', uf: 'SP', slug: 'sao-paulo', capital: true, norm: normalize('São Paulo') },
  ],
  holidays: [{ id: 'carnaval', name: 'Carnaval', label: 'Ponto facultativo', norm: 'carnaval' }],
  states: [{ uf: 'SP', name: 'São Paulo', norm: normalize('São Paulo') }],
};

describe('searchPlaces', () => {
  it('sem busca: Nacional e estados', () => {
    expect(searchPlaces(index, '', ['national', 'state', 'city'])).toEqual([{ kind: 'national' }, { kind: 'state', uf: 'SP', name: 'São Paulo' }]);
  });
  it('respeita os tipos permitidos', () => {
    expect(searchPlaces(index, 'sao paulo', ['city'])).toEqual([{ kind: 'city', ibge: 3550308, name: 'São Paulo', uf: 'SP' }]);
    expect(searchPlaces(index, 'sao paulo', ['state']).map((p) => p.kind)).toEqual(['state']);
  });
  it('não devolve feriados', () => {
    expect(searchPlaces(index, 'carnaval', ['national', 'state', 'city'])).toEqual([]);
  });
  it('"brasil" encontra Nacional', () => {
    expect(searchPlaces(index, 'bras', ['national', 'city'])[0]).toEqual({ kind: 'national' });
  });
});

describe('suggestionInput', () => {
  const base = { type: 'new', proposal: { name: 'Aniversário', rule: 'fixed:03-10' } };
  it('aceita feriado novo nacional sem lugar', () => {
    expect(suggestionInput.safeParse({ ...base, national: true }).success).toBe(true);
  });
  it('exige onde vale', () => {
    expect(suggestionInput.safeParse(base).success).toBe(false);
  });
});
