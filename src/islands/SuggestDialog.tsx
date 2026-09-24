import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';

/**
 * Diálogo de sugestão. Abre a partir de qualquer elemento com `data-suggest`,
 * cujo valor é um JSON com o contexto (feriado e/ou lugar) — assim a pessoa não
 * precisa dizer de qual cidade ou feriado está falando.
 *
 * Esta ilha só escuta os cliques: o formulário (calendário, busca de lugar…)
 * é baixado quando alguém vai sugerir, para não pesar em toda página.
 */
export interface SuggestContext {
  type?: 'new' | 'edit' | 'remove' | 'other';
  holiday?: { id: string; name: string; rule: string; kind: string; date?: string };
  place?: { uf?: string; ibge?: number; label: string };
}

type FormProps = { ctx: SuggestContext; turnstileSiteKey: string };

const loadForm = () => import('./SuggestForm').then((m) => m.default);

export default function SuggestDialog({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [Form, setForm] = useState<ComponentType<FormProps> | null>(null);
  const [opened, setOpened] = useState<{ ctx: SuggestContext; key: number } | null>(null);

  useEffect(() => {
    const trigger = (event: Event) => (event.target instanceof Element ? event.target.closest<HTMLElement>('[data-suggest]') : null);
    const onClick = (event: MouseEvent) => {
      const target = trigger(event);
      if (!target) return;
      event.preventDefault();
      let ctx: SuggestContext = {};
      try {
        ctx = JSON.parse(target.dataset.suggest || '{}') as SuggestContext;
      } catch {
        /* contexto inválido: abre em branco */
      }
      target.setAttribute('aria-busy', 'true');
      loadForm()
        .then((component) => {
          setForm(() => component);
          setOpened({ ctx, key: Date.now() });
        })
        .catch(() => undefined)
        .finally(() => target.removeAttribute('aria-busy'));
    };
    // adianta o download quando o ponteiro passa por cima do botão
    const onHover = (event: PointerEvent) => {
      if (trigger(event)) void loadForm().catch(() => undefined);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onHover, { passive: true });
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerover', onHover);
    };
  }, []);

  return Form && opened ? <Form key={opened.key} ctx={opened.ctx} turnstileSiteKey={turnstileSiteKey} /> : null;
}
