import { useEffect, useRef, useState } from 'preact/hooks';
import { daysInMonth, monthName, resolveRule, weekdayName } from '@/lib/holidays/rules';
import { parseMonthDay } from '@/lib/holidays/rule-parts';

/**
 * Calendário para escolher dia e mês de uma data que se repete todo ano
 * (valor "MM-DD"). Não há ano: a grade não alinha pelos dias da semana e
 * fevereiro sempre tem 29 dias. O rodapé mostra em que dia da semana cai.
 *
 * Controlado (`value` + `onChange`) ou, com `name`, funciona sozinho num
 * formulário HTML comum (gera um input escondido).
 */
interface Props {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  /** Ano do rodapé "em 2026 cai numa…". Padrão: ano atual. */
  year?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const LEAP = 2024;

export default function DayMonthPicker({ value, onChange, name, id, placeholder = 'Escolher data', invalid, describedBy, year }: Props) {
  const [own, setOwn] = useState(value ?? '');
  const current = onChange ? (value ?? '') : own;
  const selected = parseMonthDay(current);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(selected?.month ?? new Date().getMonth() + 1);
  const [focusDay, setFocusDay] = useState(selected?.day ?? 1);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const baseYear = year ?? new Date().getFullYear();
  const total = daysInMonth(LEAP, month);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (root.current && event.target instanceof Node && !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [open, month, focusDay]);

  function toggle() {
    if (!open) {
      setMonth(selected?.month ?? new Date().getMonth() + 1);
      setFocusDay(selected?.day ?? 1);
    }
    setOpen(!open);
  }

  function pick(day: number) {
    const next = `${pad(month)}-${pad(day)}`;
    if (onChange) onChange(next);
    else setOwn(next);
    setOpen(false);
    trigger.current?.focus();
  }

  function moveMonth(delta: number, day = focusDay) {
    const next = ((month - 1 + delta + 12) % 12) + 1;
    setMonth(next);
    setFocusDay(Math.min(day, daysInMonth(LEAP, next)));
  }

  function onKey(event: KeyboardEvent) {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => (focusDay > 1 ? setFocusDay(focusDay - 1) : moveMonth(-1, 31)),
      ArrowRight: () => (focusDay < total ? setFocusDay(focusDay + 1) : moveMonth(1, 1)),
      ArrowUp: () => setFocusDay(Math.max(1, focusDay - 7)),
      ArrowDown: () => setFocusDay(Math.min(total, focusDay + 7)),
      Home: () => setFocusDay(1),
      End: () => setFocusDay(total),
      PageUp: () => moveMonth(-1),
      PageDown: () => moveMonth(1),
      Escape: () => {
        setOpen(false);
        trigger.current?.focus();
      },
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  }

  const weeks: number[][] = [];
  for (let d = 1; d <= total; d += 7) weeks.push(Array.from({ length: Math.min(7, total - d + 1) }, (_, i) => d + i));
  const labelId = `${id ?? name ?? 'dm'}-month`;
  const occurrence = (y: number) => (selected ? resolveRule(`fixed:${current}`, y) : null);
  const thisYear = occurrence(baseYear);
  const nextYear = occurrence(baseYear + 1);

  return (
    <div ref={root} class="relative">
      {name && <input type="hidden" name={name} value={current} />}
      <button
        ref={trigger}
        id={id}
        type="button"
        class="input flex items-center gap-2.5 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={toggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="shrink-0 text-faint" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <span class={selected ? 'text-fg' : 'text-faint'}>{selected ? `${selected.day} de ${monthName(selected.month)}` : placeholder}</span>
        {selected && (
          <span class="ml-auto hidden text-xs text-faint sm:inline">todo ano</span>
        )}
      </button>
      {open && (
        <div class="popover w-72 p-3" role="dialog" aria-modal="false" aria-labelledby={labelId}>
          <div class="mb-2 flex items-center justify-between">
            <button type="button" class="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-fg" aria-label="Mês anterior" onClick={() => moveMonth(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <p id={labelId} class="text-sm font-semibold capitalize" aria-live="polite">
              {monthName(month)}
            </p>
            <button type="button" class="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-fg" aria-label="Próximo mês" onClick={() => moveMonth(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
          <div ref={grid} role="grid" aria-labelledby={labelId} class="space-y-1" onKeyDown={onKey}>
            {weeks.map((week) => (
              <div role="row" key={week[0]} class="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const isSelected = selected?.month === month && selected.day === day;
                  return (
                    <div role="gridcell" key={day} aria-selected={isSelected}>
                      <button
                        type="button"
                        data-day={day}
                        tabIndex={day === focusDay ? 0 : -1}
                        aria-label={`${day} de ${monthName(month)}`}
                        class={`tabular flex size-9 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                          isSelected ? 'bg-fg font-semibold text-bg' : 'hover:bg-subtle'
                        }`}
                        onClick={() => pick(day)}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p class="mt-3 border-t border-line pt-2 text-xs text-faint">
            {thisYear || nextYear
              ? [thisYear && `Em ${baseYear}: ${weekdayName(thisYear)}`, nextYear && `${baseYear + 1}: ${weekdayName(nextYear)}`].filter(Boolean).join(' · ')
              : 'Dia e mês que se repetem todo ano.'}
          </p>
        </div>
      )}
    </div>
  );
}
