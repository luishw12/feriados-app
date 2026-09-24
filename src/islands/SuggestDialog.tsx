import { useEffect, useRef, useState } from 'preact/hooks';
import { track } from '@/lib/analytics';

/**
 * Diálogo de sugestão. Abre a partir de qualquer elemento com `data-suggest`,
 * cujo valor é um JSON com o contexto (feriado e/ou lugar) — assim a pessoa não
 * precisa dizer de qual cidade ou feriado está falando.
 */
export interface SuggestContext {
  type?: 'new' | 'edit' | 'remove' | 'other';
  holiday?: { id: string; name: string; rule: string; kind: string; date?: string };
  place?: { uf?: string; ibge?: number; label: string };
}

type Kind = 'new' | 'edit' | 'remove' | 'other';

const MOVABLE = [
  { rule: 'easter:-48', label: 'Segunda-feira de Carnaval' },
  { rule: 'easter:-47', label: 'Terça-feira de Carnaval' },
  { rule: 'easter:-46', label: 'Quarta-feira de Cinzas' },
  { rule: 'easter:-3', label: 'Quinta-feira Santa' },
  { rule: 'easter:-2', label: 'Sexta-feira Santa' },
  { rule: 'easter:+60', label: 'Corpus Christi' },
];

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; language?: string }) => string;
      reset: (id?: string) => void;
    };
  }
}

function parseFixed(rule: string | undefined): { month: string; day: string } {
  const m = rule ? /^fixed:(\d{2})-(\d{2})$/.exec(rule) : null;
  return m ? { month: m[1]!, day: m[2]! } : { month: '', day: '' };
}

export default function SuggestDialog({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const [ctx, setCtx] = useState<SuggestContext>({});
  const [kind, setKind] = useState<Kind>('new');
  const [name, setName] = useState('');
  const [movable, setMovable] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [movableRule, setMovableRule] = useState(MOVABLE[1]!.rule);
  const [holidayKind, setHolidayKind] = useState('feriado');
  const [placeText, setPlaceText] = useState('');
  const [message, setMessage] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [contributorLink, setContributorLink] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [token, setToken] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function reset(next: SuggestContext) {
    const type = next.type ?? (next.holiday ? 'edit' : 'new');
    const fixed = parseFixed(next.holiday?.rule);
    setCtx(next);
    setKind(type);
    setName(type === 'edit' ? (next.holiday?.name ?? '') : '');
    setMovable(Boolean(next.holiday && !next.holiday.rule.startsWith('fixed:')));
    setDay(fixed.day);
    setMonth(fixed.month);
    setMovableRule(next.holiday && next.holiday.rule.startsWith('easter:') ? next.holiday.rule : MOVABLE[1]!.rule);
    setHolidayKind(next.holiday?.kind === 'facultativo' ? 'facultativo' : 'feriado');
    setPlaceText('');
    setMessage('');
    setSourceUrl('');
    setState('idle');
    setErrorMessage('');
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
  }

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

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-suggest]') : null;
      if (!target) return;
      event.preventDefault();
      let next: SuggestContext = {};
      try {
        next = JSON.parse(target.dataset.suggest || '{}') as SuggestContext;
      } catch {
        /* contexto inválido: abre em branco */
      }
      reset(next);
      dialog.current?.showModal();
      loadTurnstile();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const rule = movable ? movableRule : day && month ? `fixed:${month}-${day.padStart(2, '0')}` : '';
  const needsProposal = kind === 'new' || kind === 'edit';
  const canSubmit =
    state !== 'sending' &&
    (kind === 'new' ? name.trim().length > 2 && rule !== '' && (ctx.place || placeText.trim().length > 1) : true) &&
    (kind === 'remove' || kind === 'other' ? message.trim().length > 5 : true) &&
    (!turnstileSiteKey || token !== '');

  async function submit(event: Event) {
    event.preventDefault();
    if (!canSubmit) return;
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
    const response = await fetch('/api/suggestions/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: kind,
        holidayId: kind === 'new' ? undefined : ctx.holiday?.id,
        uf: ctx.place?.uf,
        ibge: ctx.place?.ibge,
        placeText: ctx.place ? undefined : placeText,
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
      track('suggestion_submit', { suggestion_type: kind });
      setState('done');
      return;
    }
    const body = (await response?.json().catch(() => null)) as { error?: string } | null;
    setErrorMessage(body?.error ?? 'Não foi possível enviar agora. Tente de novo em instantes.');
    setState('error');
    if (turnstileId.current) window.turnstile?.reset(turnstileId.current);
    setToken('');
  }

  const label = 'block text-sm font-medium mb-1.5';
  const input = 'input';

  return (
    <dialog
      ref={dialog}
      aria-labelledby="suggest-title"
      class="m-0 mx-auto mt-[5vh] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      {state === 'done' ? (
        <div class="space-y-4 p-6 text-center">
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
        <form onSubmit={submit} class="space-y-5 p-6" noValidate>
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 id="suggest-title" class="text-lg font-semibold">
                Sugerir {kind === 'new' ? 'um feriado' : 'uma correção'}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {ctx.holiday ? `${ctx.holiday.name}` : ''}
                {ctx.holiday && ctx.place ? ' · ' : ''}
                {ctx.place?.label ?? ''}
                {!ctx.holiday && !ctx.place ? 'Toda sugestão é revisada antes de ir ao ar.' : ''}
              </p>
            </div>
            <button type="button" class="rounded-full p-1 text-faint hover:bg-subtle hover:text-fg" aria-label="Fechar" onClick={() => dialog.current?.close()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <fieldset class="grid grid-cols-2 gap-2">
            <legend class="sr-only">Tipo de sugestão</legend>
            {(
              [
                ['edit', 'Corrigir este feriado', Boolean(ctx.holiday)],
                ['remove', 'Não é feriado aqui', Boolean(ctx.holiday)],
                ['new', 'Falta um feriado', true],
                ['other', 'Outro assunto', true],
              ] as const
            )
              .filter(([, , show]) => show)
              .map(([value, text]) => (
                <label
                  key={value}
                  class={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${kind === value ? 'border-fg bg-subtle font-medium' : 'border-line hover:bg-subtle'}`}
                >
                  <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} class="sr-only" />
                  {text}
                </label>
              ))}
          </fieldset>

          {needsProposal && (
            <div class="space-y-4">
              {!ctx.place && kind === 'new' && (
                <div>
                  <label class={label} for="sg-place">
                    Onde vale? <span class="text-faint font-normal">(cidade e estado, ou “nacional”)</span>
                  </label>
                  <input id="sg-place" class={input} value={placeText} onInput={(e) => setPlaceText(e.currentTarget.value)} required />
                </div>
              )}
              <div>
                <label class={label} for="sg-name">
                  Nome do feriado
                </label>
                <input id="sg-name" class={input} value={name} onInput={(e) => setName(e.currentTarget.value)} maxLength={120} placeholder="Ex.: Aniversário da cidade" />
              </div>
              <div>
                <span class={label}>Data</span>
                <div class="mb-2 flex gap-4 text-sm">
                  <label class="flex items-center gap-2">
                    <input type="radio" checked={!movable} onChange={() => setMovable(false)} /> Todo ano no mesmo dia
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="radio" checked={movable} onChange={() => setMovable(true)} /> Muda todo ano
                  </label>
                </div>
                {movable ? (
                  <select class={input} value={movableRule} onChange={(e) => setMovableRule(e.currentTarget.value)} aria-label="Data móvel">
                    {MOVABLE.map((m) => (
                      <option key={m.rule} value={m.rule}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div class="grid grid-cols-[5rem_1fr] gap-2">
                    <select class={input} value={day} onChange={(e) => setDay(e.currentTarget.value)} aria-label="Dia">
                      <option value="">Dia</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                        <option key={d} value={d}>
                          {Number(d)}
                        </option>
                      ))}
                    </select>
                    <select class={input} value={month} onChange={(e) => setMonth(e.currentTarget.value)} aria-label="Mês">
                      <option value="">Mês</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={String(i + 1).padStart(2, '0')}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label class={label} for="sg-kind">
                  Tipo
                </label>
                <select id="sg-kind" class={input} value={holidayKind} onChange={(e) => setHolidayKind(e.currentTarget.value)}>
                  <option value="feriado">Feriado (folga obrigatória)</option>
                  <option value="facultativo">Ponto facultativo</option>
                  <option value="comemorativa">Data comemorativa (sem folga)</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label class={label} for="sg-message">
              {kind === 'remove' ? 'Por que não é feriado?' : kind === 'other' ? 'Mensagem' : 'Detalhes'}{' '}
              {needsProposal && <span class="text-faint font-normal">(opcional)</span>}
            </label>
            <textarea id="sg-message" class={`${input} min-h-20`} value={message} onInput={(e) => setMessage(e.currentTarget.value)} maxLength={2000} />
          </div>

          <div>
            <label class={label} for="sg-source">
              Fonte <span class="text-faint font-normal">(link da lei ou do site da prefeitura — acelera a aprovação)</span>
            </label>
            <input id="sg-source" type="url" class={input} value={sourceUrl} onInput={(e) => setSourceUrl(e.currentTarget.value)} placeholder="https://" />
          </div>

          <details class="rounded-xl border border-line px-3 py-2">
            <summary class="cursor-pointer text-sm font-medium">Quer receber crédito? (opcional)</summary>
            <div class="mt-3 space-y-3">
              <input class={input} value={contributorName} onInput={(e) => setContributorName(e.currentTarget.value)} placeholder="Seu nome (aparece nos créditos)" maxLength={80} aria-label="Seu nome" />
              <input class={input} type="url" value={contributorLink} onInput={(e) => setContributorLink(e.currentTarget.value)} placeholder="Link do seu perfil (LinkedIn, GitHub…)" aria-label="Link do perfil" />
              <input class={input} type="email" value={contributorEmail} onInput={(e) => setContributorEmail(e.currentTarget.value)} placeholder="E-mail para saber quando for aprovada (não é publicado)" aria-label="E-mail" />
            </div>
          </details>

          <input type="text" name="website" value={honeypot} onInput={(e) => setHoneypot(e.currentTarget.value)} class="hidden" tabIndex={-1} autocomplete="off" aria-hidden="true" />
          {turnstileSiteKey && <div ref={turnstileBox} class="min-h-16" />}
          {state === 'error' && (
            <p role="alert" class="rounded-xl bg-[var(--color-warn-soft)] px-3 py-2 text-sm text-[var(--color-warn)]">
              {errorMessage}
            </p>
          )}

          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-faint">
              Ao enviar você concorda com a <a href="/privacidade/" class="underline">política de privacidade</a>.
            </p>
            <button type="submit" class="btn-primary" disabled={!canSubmit}>
              {state === 'sending' ? 'Enviando…' : 'Enviar sugestão'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
