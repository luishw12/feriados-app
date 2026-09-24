import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bridgeInfo, businessDays, resolveYear, upcoming, type HolidayDef } from '../../src/lib/holidays/resolve';

const national = JSON.parse(readFileSync(new URL('../../data/seed/holidays-national.json', import.meta.url), 'utf8')) as HolidayDef[];
const mandatory = (year: number) =>
  resolveYear(national, year)
    .filter((o) => o.kind === 'feriado')
    .map((o) => `${o.date} ${o.id}`);

describe('feriados nacionais', () => {
  it('2026 bate com o calendário oficial', () => {
    expect(mandatory(2026)).toEqual([
      '2026-01-01 confraternizacao-universal',
      '2026-04-03 sexta-feira-santa',
      '2026-04-21 tiradentes',
      '2026-05-01 dia-do-trabalho',
      '2026-09-07 independencia-do-brasil',
      '2026-10-12 nossa-senhora-aparecida',
      '2026-11-02 finados',
      '2026-11-15 proclamacao-da-republica',
      '2026-11-20 consciencia-negra',
      '2026-12-25 natal',
    ]);
  });

  it('Consciência Negra só é nacional a partir de 2024', () => {
    expect(mandatory(2023)).not.toContain('2023-11-20 consciencia-negra');
    expect(mandatory(2024)).toContain('2024-11-20 consciencia-negra');
  });

  it('ordena por data', () => {
    const dates = resolveYear(national, 2027).map((o) => o.date);
    expect(dates).toEqual([...dates].sort());
  });
});

describe('agrupamento de feriados do mesmo dia', () => {
  const base: Omit<HolidayDef, 'id' | 'scope' | 'kind'> = {
    name: 'Corpus Christi',
    rule: 'easter:+60',
    uf: null,
    ibge: null,
    validFrom: null,
    validTo: null,
    categories: [],
    summary: '',
    legalBasis: '',
    status: 'verified',
  };

  it('feriado municipal vence ponto facultativo nacional', () => {
    const list = resolveYear(
      [
        { ...base, id: 'corpus-christi', scope: 'national', kind: 'facultativo' },
        { ...base, id: 'corpus-christi-poa', scope: 'municipal', kind: 'feriado', uf: 'RS', ibge: 4314902 },
      ],
      2026,
    );
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('corpus-christi-poa');
    expect(list[0]?.merged).toEqual(['corpus-christi']);
  });

  it('respeita overrides (data transferida ou cancelada)', () => {
    const defs: HolidayDef[] = [{ ...base, id: 'x', scope: 'municipal', kind: 'feriado', rule: 'fixed:05-10' }];
    expect(resolveYear(defs, 2026, [{ holidayId: 'x', year: 2026, date: '05-11', note: 'transferido' }])[0]?.date).toBe('2026-05-11');
    expect(resolveYear(defs, 2026, [{ holidayId: 'x', year: 2026, date: null, note: '' }])).toHaveLength(0);
  });
});

describe('upcoming', () => {
  it('atravessa a virada do ano', () => {
    const next = upcoming(national, '2026-12-26', 2, [], (o) => o.kind === 'feriado');
    expect(next.map((o) => o.date)).toEqual(['2027-01-01', '2027-03-26']);
  });
});

describe('bridgeInfo', () => {
  it('classifica pelo dia da semana', () => {
    expect(bridgeInfo('2026-04-21').kind).toBe('emenda-segunda'); // terça
    expect(bridgeInfo('2026-06-04').kind).toBe('emenda-sexta'); // quinta
    expect(bridgeInfo('2026-04-03')).toMatchObject({ kind: 'prolongado', days: 3 }); // sexta
    expect(bridgeInfo('2026-11-15').kind).toBe('fim-de-semana'); // domingo
    expect(bridgeInfo('2026-06-04')).toMatchObject({ bridgeDay: '2026-06-05', days: 4 });
  });
});

describe('businessDays', () => {
  it('desconta fins de semana e feriados', () => {
    // abril/2026: 22 dias de semana, menos Sexta-feira Santa (3) e Tiradentes (21)
    expect(businessDays('2026-04-01', '2026-04-30', national).businessDays).toBe(20);
  });

  it('pode incluir pontos facultativos', () => {
    const regular = businessDays('2026-02-16', '2026-02-18', national).businessDays;
    const withOptional = businessDays('2026-02-16', '2026-02-18', national, [], { includeOptional: true }).businessDays;
    expect(regular).toBe(3);
    expect(withOptional).toBe(0);
  });
});
