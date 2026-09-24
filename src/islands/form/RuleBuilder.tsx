import { useState } from 'preact/hooks';
import { daysInMonth, describeRule, formatLong, isValidRule, monthName } from '@/lib/holidays/rules';
import { EASTER_PRESETS, nextOccurrences, partsToRule, ruleToParts, type RuleMode, type RuleParts } from '@/lib/holidays/rule-parts';
import DayMonthPicker from './DayMonthPicker';

/**
 * Editor visual da regra de data (painel). Gera o texto da DSL de
 * `src/lib/holidays/rules.ts` num input escondido `name`.
 */
interface Props {
  name: string;
  value: string;
}

const MODES: { mode: RuleMode; label: string }[] = [
  { mode: 'fixed', label: 'Data fixa' },
  { mode: 'easter', label: 'Páscoa' },
  { mode: 'nth', label: 'Nº dia da semana' },
  { mode: 'last', label: 'Último do mês' },
  { mode: 'raw', label: 'Avançado' },
];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const pad = (n: number) => String(n).padStart(2, '0');

export default function RuleBuilder({ name, value }: Props) {
  const [parts, setParts] = useState<RuleParts>(() => ruleToParts(value));
  const rule = partsToRule(parts);
  const valid = isValidRule(rule);
  const year = new Date().getFullYear();
  const upcoming = valid ? nextOccurrences(rule, year, 3) : [];
  const preset = EASTER_PRESETS.find((p) => p.offset === parts.offset);
  const set = (patch: Partial<RuleParts>) => setParts({ ...parts, ...patch });

  function switchMode(mode: RuleMode) {
    // o modo avançado começa com a regra atual, para ajustar à mão
    setParts({ ...parts, mode, raw: mode === 'raw' ? rule : parts.raw, day: Math.min(parts.day, daysInMonth(2024, parts.month)) });
  }

  const monthSelect = (id: string) => (
    <select id={id} class="input select" value={parts.month} onChange={(e) => set({ month: Number(e.currentTarget.value) })}>
      {Array.from({ length: 12 }, (_, i) => (
        <option key={i} value={i + 1}>
          {monthName(i + 1)}
        </option>
      ))}
    </select>
  );
  const weekdaySelect = (id: string) => (
    <select id={id} class="input select" value={parts.weekday} onChange={(e) => set({ weekday: Number(e.currentTarget.value) })}>
      {WEEKDAYS.map((w, i) => (
        <option key={w} value={i}>
          {w}
        </option>
      ))}
    </select>
  );

  return (
    <div class="space-y-4">
      <input type="hidden" name={name} value={rule} />
      <div class="segmented flex-wrap" role="radiogroup" aria-label="Tipo de data">
        {MODES.map((m) => (
          <label key={m.mode}>
            <input type="radio" class="sr-only" name={`${name}-mode`} checked={parts.mode === m.mode} onChange={() => switchMode(m.mode)} />
            {m.label}
          </label>
        ))}
      </div>

      {parts.mode === 'fixed' && (
        <div class="max-w-xs">
          <span class="field-label" id="rb-fixed-label">
            Dia e mês
          </span>
          <DayMonthPicker
            value={`${pad(parts.month)}-${pad(parts.day)}`}
            describedBy="rb-fixed-label"
            onChange={(v) => set({ month: Number(v.slice(0, 2)), day: Number(v.slice(3)) })}
          />
        </div>
      )}

      {parts.mode === 'easter' && (
        <div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <div>
            <label class="field-label" for="rb-easter">
              Data ligada à Páscoa
            </label>
            <select
              id="rb-easter"
              class="input select"
              value={preset ? String(preset.offset) : 'custom'}
              onChange={(e) => e.currentTarget.value !== 'custom' && set({ offset: Number(e.currentTarget.value) })}
            >
              {EASTER_PRESETS.map((p) => (
                <option key={p.offset} value={p.offset}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Outra (ajuste os dias)</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="rb-offset">
              Dias da Páscoa
            </label>
            <input
              id="rb-offset"
              type="number"
              class="input tabular"
              min={-120}
              max={120}
              value={parts.offset}
              onInput={(e) => {
                const n = Number(e.currentTarget.value);
                if (Number.isInteger(n) && Math.abs(n) <= 120) set({ offset: n });
              }}
            />
          </div>
        </div>
      )}

      {parts.mode === 'nth' && (
        <div class="grid gap-3 sm:grid-cols-[6rem_1fr_1fr]">
          <div>
            <label class="field-label" for="rb-n">
              Qual
            </label>
            <select id="rb-n" class="input select" value={parts.n} onChange={(e) => set({ n: Number(e.currentTarget.value) })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}º
                </option>
              ))}
            </select>
          </div>
          <div>
            <label class="field-label" for="rb-nth-dow">
              Dia da semana
            </label>
            {weekdaySelect('rb-nth-dow')}
          </div>
          <div>
            <label class="field-label" for="rb-nth-month">
              Mês
            </label>
            {monthSelect('rb-nth-month')}
          </div>
        </div>
      )}

      {parts.mode === 'last' && (
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="field-label" for="rb-last-dow">
              Último(a)
            </label>
            {weekdaySelect('rb-last-dow')}
          </div>
          <div>
            <label class="field-label" for="rb-last-month">
              Mês
            </label>
            {monthSelect('rb-last-month')}
          </div>
        </div>
      )}

      {parts.mode === 'raw' && (
        <div>
          <label class="field-label" for="rb-raw">
            Regra
          </label>
          <input
            id="rb-raw"
            class="input font-mono"
            value={parts.raw}
            aria-invalid={!valid || undefined}
            aria-describedby="rb-raw-hint"
            onInput={(e) => set({ raw: e.currentTarget.value })}
          />
          <span id="rb-raw-hint" class="field-hint">
            fixed:MM-DD · easter:±N · nth:MM:DOW:N · last:MM:DOW (DOW: 0 = domingo)
          </span>
        </div>
      )}

      <div class="rounded-xl bg-subtle px-3.5 py-2.5 text-sm" aria-live="polite">
        {valid ? (
          <>
            <span class="font-medium">{describeRule(rule)}</span>
            <span class="ml-2 font-mono text-xs text-faint">{rule}</span>
            <span class="mt-1 block text-xs text-muted">Próximas: {upcoming.map(formatLong).join(' · ')}</span>
          </>
        ) : (
          <span class="font-medium text-warn">Regra inválida</span>
        )}
      </div>
    </div>
  );
}
