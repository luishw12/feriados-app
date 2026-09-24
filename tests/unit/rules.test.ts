import { describe, expect, it } from 'vitest';
import { describeRule, easterSunday, parseRule, resolveRule, todayInBrazil, weekday } from '../../src/lib/holidays/rules';

describe('easterSunday', () => {
  // Datas oficiais do Domingo de Páscoa (calendário gregoriano).
  const known: Record<number, string> = {
    1990: '1990-04-15',
    2000: '2000-04-23',
    2008: '2008-03-23',
    2011: '2011-04-24',
    2019: '2019-04-21',
    2024: '2024-03-31',
    2025: '2025-04-20',
    2026: '2026-04-05',
    2027: '2027-03-28',
    2028: '2028-04-16',
    2029: '2029-04-01',
    2030: '2030-04-21',
    2038: '2038-04-25',
    2049: '2049-04-18',
    2100: '2100-03-28',
  };
  for (const [year, date] of Object.entries(known)) {
    it(`calcula ${year}`, () => expect(easterSunday(Number(year))).toBe(date));
  }

  it('sempre cai num domingo entre 22/03 e 25/04', () => {
    for (let y = 1900; y <= 2200; y++) {
      const date = easterSunday(y);
      expect(weekday(date)).toBe(0);
      expect(date.slice(5) >= '03-22' && date.slice(5) <= '04-25').toBe(true);
    }
  });
});

describe('resolveRule', () => {
  it('datas fixas', () => {
    expect(resolveRule('fixed:12-25', 2026)).toBe('2026-12-25');
    expect(resolveRule('fixed:02-29', 2025)).toBeNull();
    expect(resolveRule('fixed:02-29', 2028)).toBe('2028-02-29');
  });

  it('datas móveis de 2026', () => {
    expect(resolveRule('easter:-47', 2026)).toBe('2026-02-17'); // Carnaval
    expect(resolveRule('easter:-2', 2026)).toBe('2026-04-03'); // Sexta-feira Santa
    expect(resolveRule('easter:+60', 2026)).toBe('2026-06-04'); // Corpus Christi
  });

  it('datas móveis de 2027', () => {
    expect(resolveRule('easter:-47', 2027)).toBe('2027-02-09');
    expect(resolveRule('easter:+60', 2027)).toBe('2027-05-27');
  });

  it('n-ésimo dia da semana', () => {
    expect(resolveRule('nth:05:0:2', 2026)).toBe('2026-05-10'); // Dia das Mães
    expect(resolveRule('nth:08:0:2', 2026)).toBe('2026-08-09'); // Dia dos Pais
    expect(resolveRule('nth:02:1:5', 2026)).toBeNull();
  });

  it('último dia da semana do mês', () => {
    expect(resolveRule('last:10:5', 2026)).toBe('2026-10-30');
    expect(resolveRule('last:05:1', 2026)).toBe('2026-05-25');
  });

  it('rejeita regras inválidas', () => {
    for (const rule of ['fixed:13-01', 'fixed:1-1', 'easter:10', 'nth:05:7:1', 'foo', '']) {
      expect(parseRule(rule)).toBeNull();
    }
  });
});

describe('describeRule', () => {
  it('descreve em português', () => {
    expect(describeRule('fixed:09-07')).toBe('7 de setembro');
    expect(describeRule('easter:-47')).toBe('47 dias antes da Páscoa');
    expect(describeRule('easter:+60')).toBe('60 dias depois da Páscoa');
    expect(describeRule('nth:05:0:2')).toBe('2º domingo de maio');
  });
});

describe('todayInBrazil', () => {
  it('usa o fuso de Brasília', () => {
    expect(todayInBrazil(new Date('2026-01-01T02:00:00Z'))).toBe('2025-12-31');
    expect(todayInBrazil(new Date('2026-01-01T03:00:00Z'))).toBe('2026-01-01');
  });
});
