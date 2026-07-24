import { useEffect, useState, type FormEvent, type InvalidEvent } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Github, X } from 'lucide-react';
import type { ContributionOpenDetail, ContributionPayload } from '@/lib/contributions';
import {
  autoFillCitySlug,
  buildInitialPayload,
  CONTRIBUTION_MODE_LABELS,
  submitContribution,
  syncHolidayTypeWithScope,
} from '@/lib/contributions';
import HolidayFields from '@/components/interactive/contribution/HolidayFields';
import ArticleFields from '@/components/interactive/contribution/ArticleFields';
import ImageUploadField from '@/components/interactive/contribution/ImageUploadField';
import ContributorFields from '@/components/interactive/contribution/ContributorFields';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';

interface Props {
  detail: ContributionOpenDetail;
  onClose: () => void;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
type TabId = 'holiday' | 'article' | 'image' | 'details';

interface TabItem {
  id: TabId;
  label: string;
}

function buildTabs(mode: ContributionOpenDetail['mode']): TabItem[] {
  const items: TabItem[] = [];
  if (mode !== 'enrich_content') {
    items.push({ id: 'holiday', label: 'Feriado' });
  }
  items.push(
    { id: 'article', label: 'Artigo' },
    { id: 'image', label: 'Imagem' },
    { id: 'details', label: 'Envio' },
  );
  return items;
}

function isTabId(value: string | undefined): value is TabId {
  return value === 'holiday' || value === 'article' || value === 'image' || value === 'details';
}

export default function ContributionModal({ detail, onClose }: Props) {
  const [form, setForm] = useState<ContributionPayload>(() => buildInitialPayload(detail));
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [prUrl, setPrUrl] = useState('');

  const mode = detail.mode;
  const title = CONTRIBUTION_MODE_LABELS[mode];
  const requireImage = mode === 'suggest_holiday';
  const busy = status === 'submitting';
  const tabs = buildTabs(mode);

  const [activeTab, setActiveTab] = useState<TabId>(() => buildTabs(mode)[0]?.id ?? 'article');
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab),
  );
  const isFirstTab = activeIndex <= 0;
  const isLastTab = activeIndex >= tabs.length - 1;

  useEffect(() => {
    const nextTabs = buildTabs(mode);
    if (!nextTabs.some((tab) => tab.id === activeTab) && nextTabs[0]) {
      setActiveTab(nextTabs[0].id);
    }
  }, [mode, activeTab]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, busy]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function updateField<K extends keyof ContributionPayload>(key: K, value: ContributionPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateHoliday<K extends keyof ContributionPayload['holiday']>(
    key: K,
    value: ContributionPayload['holiday'][K],
  ) {
    setForm((prev) => {
      let holiday = { ...prev.holiday, [key]: value };
      if (key === 'scope' || key === 'city') {
        holiday = syncHolidayTypeWithScope(holiday);
      }
      if (key === 'city') {
        holiday = autoFillCitySlug(holiday);
      }
      return { ...prev, holiday };
    });
  }

  function updateArticle<K extends keyof ContributionPayload['article']>(
    key: K,
    value: ContributionPayload['article'][K],
  ) {
    setForm((prev) => ({ ...prev, article: { ...prev.article, [key]: value } }));
  }

  function goRelative(delta: number) {
    const next = tabs[activeIndex + delta];
    if (next) setActiveTab(next.id);
  }

  function revealTabForElement(element: HTMLElement) {
    const panel = element.closest<HTMLElement>('[data-tab-panel]');
    const tabId = panel?.dataset.tabPanel;
    if (isTabId(tabId)) {
      setActiveTab(tabId);
      window.setTimeout(() => {
        element.focus();
        if ('reportValidity' in element && typeof element.reportValidity === 'function') {
          element.reportValidity();
        }
      }, 0);
    }
  }

  function handleInvalid(event: InvalidEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.target;
    if (target instanceof HTMLElement) {
      revealTabForElement(target);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;

    const panels = Array.from(formEl.querySelectorAll<HTMLElement>('[data-tab-panel]'));
    panels.forEach((panel) => {
      panel.hidden = false;
      panel.classList.remove('hidden');
    });

    if (!formEl.checkValidity()) {
      const invalid = formEl.querySelector<HTMLElement>(':invalid');
      const invalidTab = invalid?.closest<HTMLElement>('[data-tab-panel]')?.dataset.tabPanel;

      panels.forEach((panel) => {
        const show = panel.dataset.tabPanel === invalidTab;
        panel.hidden = !show;
        panel.classList.toggle('hidden', !show);
      });

      if (invalid) {
        revealTabForElement(invalid);
      }
      return;
    }

    panels.forEach((panel) => {
      const show = panel.dataset.tabPanel === activeTab;
      panel.hidden = !show;
      panel.classList.toggle('hidden', !show);
    });

    setStatus('submitting');
    setErrorMessage('');

    const payload: ContributionPayload = {
      ...form,
      holiday: autoFillCitySlug(syncHolidayTypeWithScope(form.holiday)),
    };

    const result = await submitContribution(payload);

    if (!result.ok) {
      setStatus('error');
      setErrorMessage(result.error);
      return;
    }

    setStatus('success');
    if (result.prUrl) setPrUrl(result.prUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 lg:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-md dark:bg-neutral-950/70"
        aria-label="Fechar"
        onClick={busy ? undefined : onClose}
        disabled={busy}
      />

      <div
        className="relative z-10 flex h-[94vh] max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl border border-indigo-300/25 bg-[#eef2ff]/55 shadow-glow backdrop-blur-2xl dark:border-indigo-400/20 dark:bg-[#020617]/75 sm:h-[min(820px,92vh)] sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl lg:max-w-5xl xl:max-w-6xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contribution-modal-title"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <header className="shrink-0 border-b border-indigo-300/20 px-4 pb-0 pt-4 dark:border-indigo-400/15 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                Contribuir
              </p>
              <h2
                id="contribution-modal-title"
                className="mt-1 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-xl"
              >
                {title}
              </h2>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                <Github className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                Enviado como pull request no GitHub para revisão.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl p-2 text-neutral-400 transition-colors duration-150 hover:bg-white/50 hover:text-neutral-700 disabled:opacity-50 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {status !== 'success' && (
            <div className="mt-4 pb-4">
              <Stepper
                steps={tabs}
                currentIndex={activeIndex}
                onStepClick={(index) => {
                  const step = tabs[index];
                  if (step) setActiveTab(step.id);
                }}
              />
            </div>
          )}
        </header>

        <div className="scroll-area scroll-area-y min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
          {status === 'success' ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="rounded-full bg-emerald-500/15 p-3 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="max-w-md space-y-2">
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Obrigado pela contribuição!
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Criamos um pull request com suas alterações. O mantenedor vai revisar antes de
                  publicar.
                  {prUrl && (
                    <>
                      {' '}
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                      >
                        Ver pull request no GitHub
                      </a>
                    </>
                  )}
                </p>
              </div>
              <Button type="button" onClick={onClose}>
                Fechar
              </Button>
            </div>
          ) : (
            <form
              id="contribution-form"
              noValidate
              onSubmit={handleSubmit}
              onInvalid={handleInvalid}
              className="h-full"
            >
              {mode !== 'enrich_content' && (
                <div
                  id="contribution-panel-holiday"
                  role="tabpanel"
                  data-tab-panel="holiday"
                  aria-labelledby="contribution-tab-holiday"
                  hidden={activeTab !== 'holiday'}
                  className={cn(activeTab === 'holiday' ? 'block' : 'hidden')}
                >
                  <HolidayFields form={form} mode={mode} updateHoliday={updateHoliday} />
                </div>
              )}

              <div
                id="contribution-panel-article"
                role="tabpanel"
                data-tab-panel="article"
                aria-labelledby="contribution-tab-article"
                hidden={activeTab !== 'article'}
                className={cn(activeTab === 'article' ? 'block' : 'hidden')}
              >
                <ArticleFields form={form} mode={mode} updateArticle={updateArticle} />
              </div>

              <div
                id="contribution-panel-image"
                role="tabpanel"
                data-tab-panel="image"
                aria-labelledby="contribution-tab-image"
                hidden={activeTab !== 'image'}
                className={cn(activeTab === 'image' ? 'block' : 'hidden')}
              >
                <ImageUploadField
                  article={form.article}
                  requireImage={requireImage}
                  updateArticle={updateArticle}
                  setError={setErrorMessage}
                />
              </div>

              <div
                id="contribution-panel-details"
                role="tabpanel"
                data-tab-panel="details"
                aria-labelledby="contribution-tab-details"
                hidden={activeTab !== 'details'}
                className={cn(activeTab === 'details' ? 'block' : 'hidden')}
              >
                <ContributorFields form={form} updateField={updateField} />
              </div>

              {status === 'error' && errorMessage && (
                <p className="mt-4 rounded-xl border border-red-300/40 bg-red-50/80 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
                  {errorMessage}
                </p>
              )}
            </form>
          )}
        </div>

        {status !== 'success' && (
          <footer className="flex shrink-0 flex-col gap-3 border-t border-indigo-300/20 bg-[#eef2ff]/40 px-4 py-3 backdrop-blur-xl dark:border-indigo-400/15 dark:bg-[#020617]/50 sm:px-6">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Nome e rede social só aparecem se a contribuição for aprovada.{' '}
              <a
                href="/privacidade/"
                className="text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
              >
                Privacidade
              </a>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
                Cancelar
              </Button>

              <div className="ml-auto flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goRelative(-1)}
                  disabled={busy || isFirstTab}
                >
                  <ChevronLeft data-icon="inline-start" />
                  Anterior
                </Button>

                {!isLastTab && (
                  <Button type="button" variant="secondary" onClick={() => goRelative(1)} disabled={busy}>
                    Próximo
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                )}

                <Button type="submit" form="contribution-form" disabled={busy}>
                  {busy ? 'Enviando…' : 'Enviar'}
                </Button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
