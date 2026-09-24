import { useEffect, useRef, useState } from 'preact/hooks';
import { describeRule } from '@/lib/holidays/rules';
import { EASTER_PRESETS } from '@/lib/holidays/rule-parts';
import DayMonthPicker from './form/DayMonthPicker';
import PlacePicker from './form/PlacePicker';
import type { Place } from './search-core';

import type { SuggestContext } from './SuggestDialog';

/**
 * Formulário de sugestão dentro do <dialog>. Carregado sob demanda por
 * `SuggestDialog` no primeiro clique; cada abertura remonta o componente
 * (via `key`) com o contexto novo.
 */

type Kind = 'new' | 'edit' | 'remove' | 'other';
type Field = 'place' | 'name' | 'date' | 'message' | 'robot';

const MOVABLE = EASTER_PRESETS.filter((p) => p.offset !== 0).map((p) => ({ rule: `easter:${p.offset >= 0 ? '+' : ''}${p.offset}`, label: p.label }));
const DEFAULT_MOVABLE = 'easter:-47';

const HOLIDAY_KINDS = [
  { value: 'feriado', label: 'Feriado', hint: 'Folga obrigatória' },
  { value: 'facultativo', label: 'Ponto facultativo', hint: 'Cada órgão decide' },
  { value: 'comemorativa', label: 'Data comemorativa', hint: 'Sem folga' },
] as const;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; language?: string }) => string;
      reset: (id?: string) => void;
    };
  }
}

function contextPlace(place: SuggestContext['place']): Place | null {
  if (!place?.uf) return null;
  if (place.ibge) return { kind: 'city', ibge: place.ibge, uf: place.uf, name: place.label.replace(/\s*\([A-Z]{2}\)$/, '') };
  return { kind: 'state', uf: place.uf, name: place.label };
}

export default function SuggestForm({ ctx, turnstileSiteKey }: { ctx: SuggestContext; turnstileSiteKey: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const initialType = ctx.type ?? (ctx.holiday ? 'edit' : 'new');
  const initialRule = ctx.holiday?.rule ?? '';
  const [kind, setKind] = useState<Kind>(initialType);
  const [place, setPlace] = useState<Place | null>(() => contextPlace(ctx.place));
  const [manualPlace, setManualPlace] = useState(false);
  const [placeText, setPlaceText] = useState('');
  const [name, setName] = useState(initialType === 'edit' ? (ctx.holiday?.name ?? '') : '');
  const [movable, setMovable] = useState(Boolean(ctx.holiday && !initialRule.startsWith('fixed:')));
  const [dayMonth, setDayMonth] = useState(initialRule.startsWith('fixed:') ? initialRule.slice(6) : '');
  const [movableRule, setMovableRule] = useState(ctx.holiday && !initialRule.startsWith('fixed:') ? initialRule : DEFAULT_MOVABLE);
  const [holidayKind, setHolidayKind] = useState(
    ctx.holiday?.kind === 'facultativo' || ctx.holiday?.kind === 'comemorativa' ? ctx.holiday.kind : 'feriado',
  );
  const [message, setMessage] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [contributorLink, setContributorLink] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [token, setToken] = useState('');
  const [tried, setTried] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('contributor') ?? 'null') as { name?: string; link?: string; email?: string } | null;
      if (saved) {
        setContributorName(saved.name ?? '');
        setContributorLink(saved.link ?? '');
        setContributorEmail(saved.email ?? '');
      }
    } catch {
      /* localStorage indisponível */
    }
    dialog.current?.showModal();
    loadTurnstile();
  }, []);

  function loadTurnstile() {
    if (!turnstileSiteKey || !turnstileBox.current) return;
    const render = () => {
      if (!window.turnstile || !turnstileBox.current) return;
      if (turnstileId.current) {
        window.turnstile.reset(turnstileId.current);
        return;
      }
      turnstileId.current = window.turnstile.render(turnstileBox.current, {
        sitekey: turnstileSiteKey,
        language: 'pt-br',
        callback: setToken,
        'expired-callback': () => setToken(''),
      });
    };
    if (window.turnstile) return render();
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }

  const rule = movable ? movableRule : dayMonth ? `fixed:${dayMonth}` : '';
  const needsProposal = kind === 'new' || kind === 'edit';
  const hasChange = kind === 'edit' && (name.trim() !== ctx.holiday?.name || rule !== ctx.holiday?.rule || holidayKind !== ctx.holiday?.kind);

  const errors: Partial<Record<Field, string>> = {};
  if (kind === 'new') {
    if (manualPlace ? placeText.trim().length < 2 : !place) errors.place = manualPlace ? 'Escreva a cidade e o estado.' : 'Escolha a cidade, o estado ou “Nacional”.';
    if (name.trim().length < 3) errors.name = 'Informe o nome do feriado.';
    if (!rule) errors.date = 'Escolha a data.';
  }
  if (kind === 'edit' && !hasChange && message.trim().length < 5) errors.message = 'Altere algum campo acima ou diga o que precisa ser corrigido.';
  if ((kind === 'remove' || kind === 'other') && message.trim().length < 5) errors.message = 'Escreva pelo menos uma frase explicando.';
  if (turnstileSiteKey && !token) errors.robot = 'Aguarde a verificação anti-robô terminar.';
  const show = (field: Field) => (tried ? errors[field] : undefined);

  const movableOptions = MOVABLE.some((m) => m.rule === movableRule) ? MOVABLE : [{ rule: movableRule, label: describeRule(movableRule) }, ...MOVABLE];

  async function submit(event: Event) {
    event.preventDefault();
    if (state === 'sending') return;
    setTried(true);
    const first = (Object.keys(errors) as Field[])[0];
    if (first) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] button, [data-field="${first}"] textarea`)?.focus());
      return;
    }
    setState('sending');
    try {
      localStorage.setItem('contributor', JSON.stringify({ name: contributorName, link: contributorLink, email: contributorEmail }));
    } catch {
      /* ignorado */
    }
    const proposal: Record<string, string> = {};
    if (needsProposal) {
      if (name.trim() && name.trim() !== ctx.holiday?.name) proposal.name = name.trim();
      if (rule && rule !== ctx.holiday?.rule) proposal.rule = rule;
      if (holidayKind !== (ctx.holiday?.kind ?? '')) proposal.kind = holidayKind;
    }
    // Feriado novo: vale o lugar escolhido; correção/remoção: o lugar da página.
    const chosen = kind === 'new' ? (manualPlace ? null : place) : contextPlace(ctx.place);
    const response = await fetch('/api/suggestions/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: kind,
        holidayId: kind === 'new' ? undefined : ctx.holiday?.id,
        uf: chosen && chosen.kind !== 'national' ? chosen.uf : undefined,
        ibge: chosen?.kind === 'city' ? chosen.ibge : undefined,
        national: chosen?.kind === 'national' ? true : undefined,
        placeText: kind === 'new' && manualPlace ? placeText : undefined,
        proposal,
        message,
        sourceUrl,
        contributorName,
        contributorLink,
        contributorEmail,
        website: honeypot,
        turnstileToken: token,
        page: window.location.pathname,
      }),
    }).catch(() => null);
    if (response?.ok) {
      setState('done');
      return;
    }
    const body = (await response?.json().catch(() => null)) as { error?: string } | null;
    setErrorMessage(body?.error ?? 'Não foi possível enviar agora. Tente de novo em instantes.');
    setState('error');
    if (turnstileId.current) window.turnstile?.reset(turnstileId.current);
    setToken('');
  }

  const optional = <span class="font-normal text-faint">(opcional)</span>;
  const errorText = (field: Field, id: string) =>
    show(field) ? (
      <span id={id} class="field-error" role="alert">
        {show(field)}
      </span>
    ) : null;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="suggest-title"
      class="m-0 mx-auto mt-[4vh] max-h-[92vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      {state === 'done' ? (
        <div class="space-y-4 p-8 text-center">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--color-municipal-soft)] text-[var(--color-ok)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h2 class="text-lg font-semibold">Obrigado pela contribuição!</h2>
          <p class="text-sm text-muted">
            Sua sugestão entrou na fila de revisão. Quando for aprovada, o site é atualizado na hora
            {contributorName ? ' e seu nome aparece nos créditos do feriado' : ''}.
          </p>
          <button type="button" class="btn-primary" onClick={() => dialog.current?.close()}>
            Fechar
          </button>
        </div>
      ) : (
        <form ref={form} onSubmit={submit} noValidate>
          <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-4">
            <div class="min-w-0">
              <h2 id="suggest-title" class="text-lg font-semibold">
                Sugerir {kind === 'new' ? 'um feriado' : 'uma correção'}
              </h2>
              <p class="mt-0.5 truncate text-sm text-muted">
                {ctx.holiday ? [ctx.holiday.name, ctx.place?.label].filter(Boolean).join(' · ') : 'Toda sugestão é revisada antes de ir ao ar.'}
              </p>
            </div>
            <button type="button" class="-mr-1 rounded-full p-1.5 text-faint hover:bg-subtle hover:text-fg" aria-label="Fechar" onClick={() => dialog.current?.close()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div class="space-y-6 px-6 py-5">
            <fieldset>
              <legend class="field-label">O que você quer fazer?</legend>
              <div class="grid grid-cols-2 gap-2">
                {(
                  [
                    ['edit', 'Corrigir este feriado', Boolean(ctx.holiday)],
                    ['remove', 'Não é feriado aqui', Boolean(ctx.holiday)],
                    ['new', 'Falta um feriado', true],
                    ['other', 'Outro assunto', true],
                  ] as const
                )
                  .filter(([, , visible]) => visible)
                  .map(([value, text]) => (
                    <label key={value} class="choice">
                      <input type="radio" name="suggest-type" value={value} checked={kind === value} onChange={() => setKind(value)} class="sr-only" />
                      {text}
                    </label>
                  ))}
              </div>
            </fieldset>

            {needsProposal && (
              <div class="space-y-5">
                {kind === 'new' && (
                  <div data-field="place">
                    <label class="field-label" for={manualPlace ? 'sg-place-text' : 'sg-place'}>
                      Onde vale?
                    </label>
                    {manualPlace ? (
                      <>
                        <input
                          id="sg-place-text"
                          class="input"
                          value={placeText}
                          onInput={(e) => setPlaceText(e.currentTarget.value)}
                          placeholder="Ex.: Distrito de Tal, Cidade (UF)"
                          maxLength={120}
                          aria-invalid={Boolean(show('place')) || undefined}
                          aria-describedby="sg-place-error"
                        />
                        <button type="button" class="mt-1.5 text-xs text-faint underline hover:text-fg" onClick={() => setManualPlace(false)}>
                          Voltar para a busca
                        </button>
                      </>
                    ) : (
                      <PlacePicker
                        id="sg-place"
                        value={place}
                        onChange={setPlace}
                        allow={['national', 'state', 'city']}
                        placeholder="Busque a cidade ou o estado"
                        invalid={Boolean(show('place'))}
                        describedBy="sg-place-error"
                        onNotFound={() => setManualPlace(true)}
                      />
                    )}
                    {errorText('place', 'sg-place-error')}
                  </div>
                )}

                <div data-field="name">
                  <label class="field-label" for="sg-name">
                    Nome do feriado
                  </label>
                  <input
                    id="sg-name"
                    class="input"
                    value={name}
                    onInput={(e) => setName(e.currentTarget.value)}
                    maxLength={120}
                    placeholder="Ex.: Aniversário da cidade"
                    aria-invalid={Boolean(show('name')) || undefined}
                    aria-describedby="sg-name-error"
                  />
                  {errorText('name', 'sg-name-error')}
                </div>

                <div data-field="date">
                  <span class="field-label" id="sg-date-label">
                    Data
                  </span>
                  <div class="segmented mb-2" role="radiogroup" aria-labelledby="sg-date-label">
                    <label>
                      <input type="radio" class="sr-only" name="sg-movable" checked={!movable} onChange={() => setMovable(false)} />
                      Mesmo dia todo ano
                    </label>
                    <label>
                      <input type="radio" class="sr-only" name="sg-movable" checked={movable} onChange={() => setMovable(true)} />
                      Muda todo ano
                    </label>
                  </div>
                  {movable ? (
                    <select class="input select" value={movableRule} onChange={(e) => setMovableRule(e.currentTarget.value)} aria-label="Data móvel">
                      {movableOptions.map((m) => (
                        <option key={m.rule} value={m.rule}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <DayMonthPicker
                      id="sg-date"
                      value={dayMonth}
                      onChange={setDayMonth}
                      placeholder="Escolher dia e mês"
                      invalid={Boolean(show('date'))}
                      describedBy={show('date') ? 'sg-date-label sg-date-error' : 'sg-date-label'}
                    />
                  )}
                  {errorText('date', 'sg-date-error')}
                </div>

                <fieldset>
                  <legend class="field-label">Tipo</legend>
                  <div class="grid gap-2 sm:grid-cols-3">
                    {HOLIDAY_KINDS.map((k) => (
                      <label key={k.value} class="choice">
                        <input type="radio" class="sr-only" name="sg-kind" value={k.value} checked={holidayKind === k.value} onChange={() => setHolidayKind(k.value)} />
                        <span class="font-medium">{k.label}</span>
                        <span class="text-xs text-muted">{k.hint}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            <div data-field="message">
              <label class="field-label" for="sg-message">
                {kind === 'remove' ? 'Por que não é feriado?' : kind === 'other' ? 'Mensagem' : 'Detalhes'} {needsProposal && optional}
              </label>
              <textarea
                id="sg-message"
                class="input min-h-24"
                value={message}
                onInput={(e) => setMessage(e.currentTarget.value)}
                maxLength={2000}
                aria-invalid={Boolean(show('message')) || undefined}
                aria-describedby="sg-message-error"
              />
              {errorText('message', 'sg-message-error')}
            </div>

            <div>
              <label class="field-label" for="sg-source">
                Fonte {optional}
              </label>
              <input id="sg-source" type="url" class="input" value={sourceUrl} onInput={(e) => setSourceUrl(e.currentTarget.value)} placeholder="https://" aria-describedby="sg-source-hint" />
              <span id="sg-source-hint" class="field-hint">
                Link da lei ou do site da prefeitura. Acelera a aprovação.
              </span>
            </div>

            <details class="group rounded-xl border border-line-strong">
              <summary class="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                Quer receber crédito? {optional}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-faint transition-transform group-open:rotate-180" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div class="space-y-4 border-t border-line px-3.5 py-4">
                <div>
                  <label class="field-label" for="sg-contrib-name">
                    Seu nome
                  </label>
                  <input id="sg-contrib-name" class="input" value={contributorName} onInput={(e) => setContributorName(e.currentTarget.value)} maxLength={80} autocomplete="name" />
                  <span class="field-hint">Aparece nos créditos do feriado.</span>
                </div>
                <div>
                  <label class="field-label" for="sg-contrib-link">
                    Link do seu perfil
                  </label>
                  <input id="sg-contrib-link" class="input" type="url" value={contributorLink} onInput={(e) => setContributorLink(e.currentTarget.value)} placeholder="LinkedIn, GitHub…" />
                </div>
                <div>
                  <label class="field-label" for="sg-contrib-email">
                    E-mail
                  </label>
                  <input id="sg-contrib-email" class="input" type="email" value={contributorEmail} onInput={(e) => setContributorEmail(e.currentTarget.value)} autocomplete="email" />
                  <span class="field-hint">Para avisar quando for aprovada. Não é publicado.</span>
                </div>
              </div>
            </details>

            <input type="text" name="website" value={honeypot} onInput={(e) => setHoneypot(e.currentTarget.value)} class="hidden" tabIndex={-1} autocomplete="off" aria-hidden="true" />
            {turnstileSiteKey && <div ref={turnstileBox} class="min-h-16" />}
            {show('robot') && (
              <p role="alert" class="field-error">
                {show('robot')}
              </p>
            )}
            {state === 'error' && (
              <p role="alert" class="rounded-xl bg-[var(--color-warn-soft)] px-3.5 py-2.5 text-sm text-warn">
                {errorMessage}
              </p>
            )}
          </div>

          <div class="sticky bottom-0 flex flex-col-reverse items-stretch gap-3 border-t border-line bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-faint">
              Ao enviar você concorda com a <a href="/privacidade/" class="underline">política de privacidade</a>.
            </p>
            <button type="submit" class="btn-primary" disabled={state === 'sending'}>
              {state === 'sending' ? 'Enviando…' : 'Enviar sugestão'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
