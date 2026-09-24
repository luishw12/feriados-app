import { describe, expect, it } from 'vitest';
import { nextOccurrences, parseMonthDay, partsToRule, ruleToParts } from '../../src/lib/holidays/rule-parts';

describe('ruleToParts / partsToRule', () => {
  for (const rule of ['fixed:12-25', 'fixed:02-29', 'easter:-47', 'easter:+60', 'easter:+0', 'nth:05:0:2', 'last:10:5']) {
    it(`ida e volta: ${rule}`, () => expect(partsToRule(ruleToParts(rule))).toBe(rule));
  }

  it('lê os campos', () => {
    expect(ruleToParts('nth:05:0:2')).toMatchObject({ mode: 'nth', month: 5, weekday: 0, n: 2 });
    expect(ruleToParts('easter:-2')).toMatchObject({ mode: 'easter', offset: -2 });
  });

  it('regra desconhecida vai para o modo avançado', () => {
    expect(ruleToParts('qualquer coisa')).toMatchObject({ mode: 'raw', raw: 'qualquer coisa' });
    expect(ruleToParts('').mode).toBe('fixed');
  });
});

describe('nextOccurrences', () => {
  it('pula anos sem 29/02', () => {
    expect(nextOccurrences('fixed:02-29', 2026, 2)).toEqual(['2028-02-29', '2032-02-29']);
  });
  it('datas móveis', () => {
    expect(nextOccurrences('easter:-47', 2026, 2)).toEqual(['2026-02-17', '2027-02-09']);
  });
});

describe('parseMonthDay', () => {
  it('valida dia e mês', () => {
    expect(parseMonthDay('02-29')).toEqual({ month: 2, day: 29 });
    expect(parseMonthDay('02-30')).toBeNull();
    expect(parseMonthDay('')).toBeNull();
  });
});
