import { useEffect, useRef, useState } from 'preact/hooks';
import type { Place } from '../search-core';
import PlacePicker from './PlacePicker';

/**
 * Abrangência + lugar do feriado (painel). A abrangência decide o que pode ser
 * escolhido: estadual → só estados, municipal → só cidades. Gera os campos
 * `scope`, `uf` e `ibge` que `parseHolidayForm` já valida no servidor.
 */
type Scope = 'national' | 'state' | 'municipal';

interface Props {
  scope: Scope;
  place: Place | null;
  states: { uf: string; name: string }[];
  /** Lugar digitado por quem sugeriu, para já começar a busca. */
  hint?: string | undefined;
}

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'national', label: 'Nacional' },
  { value: 'state', label: 'Estadual' },
  { value: 'municipal', label: 'Municipal' },
];

function fits(scope: Scope, place: Place | null): boolean {
  return scope === 'national' || (scope === 'state' ? place?.kind === 'state' : place?.kind === 'city');
}

export default function ScopePlaceField({ scope: initialScope, place: initialPlace, states, hint }: Props) {
  const [scope, setScope] = useState<Scope>(initialScope);
  const [place, setPlace] = useState<Place | null>(fits(initialScope, initialPlace) ? initialPlace : null);
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const ok = fits(scope, place);

  function changeScope(next: Scope) {
    setScope(next);
    setError(false);
    // cidade → estadual: aproveita a UF da cidade
    if (next === 'state' && place?.kind === 'city') {
      const state = states.find((s) => s.uf === place.uf);
      setPlace(state ? { kind: 'state', uf: state.uf, name: state.name } : null);
    } else if (!fits(next, place)) setPlace(null);
  }

  useEffect(() => {
    const form = root.current?.closest('form');
    if (!form) return;
    const onSubmit = (event: SubmitEvent) => {
      const submitter = event.submitter;
      if (submitter instanceof HTMLButtonElement && submitter.formNoValidate) return;
      if (fits(scope, place)) return;
      event.preventDefault();
      setError(true);
      document.getElementById('sp-place')?.focus();
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  }, [scope, place]);

  const uf = place && place.kind !== 'national' ? place.uf : '';
  const ibge = place?.kind === 'city' ? String(place.ibge) : '';

  return (
    <div ref={root} class="space-y-4">
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="uf" value={scope === 'national' ? '' : uf} />
      <input type="hidden" name="ibge" value={scope === 'municipal' ? ibge : ''} />
      <div>
        <span class="field-label" id="sp-scope-label">
          Abrangência
        </span>
        <div class="segmented max-w-md" role="radiogroup" aria-labelledby="sp-scope-label">
          {SCOPES.map((s) => (
            <label key={s.value}>
              <input type="radio" class="sr-only" name="scope-choice" checked={scope === s.value} onChange={() => changeScope(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
      </div>
      {scope === 'national' ? (
        <p class="text-sm text-muted">Vale em todo o Brasil.</p>
      ) : (
        <div>
          <label class="field-label" for="sp-place">
            {scope === 'state' ? 'Estado' : 'Cidade'}
          </label>
          <PlacePicker
            id="sp-place"
            value={place}
            allow={scope === 'state' ? ['state'] : ['city']}
            initialQuery={hint ?? ''}
            placeholder={scope === 'state' ? 'Digite o nome ou a sigla do estado' : 'Digite o nome da cidade'}
            invalid={error && !ok}
            describedBy={error && !ok ? 'sp-error' : undefined}
            onChange={(p) => {
              setPlace(p);
              setError(false);
            }}
          />
          {error && !ok && (
            <span id="sp-error" class="field-error" role="alert">
              Escolha {scope === 'state' ? 'o estado' : 'a cidade'} na lista.
            </span>
          )}
          {hint && <span class="field-hint">Lugar informado na sugestão: “{hint}”</span>}
        </div>
      )}
    </div>
  );
}
