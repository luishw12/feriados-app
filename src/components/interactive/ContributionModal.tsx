import { useEffect, useState, type FormEvent } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
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
import ContributorFields from '@/components/interactive/contribution/ContributorFields';

interface Props {
  detail: ContributionOpenDetail;
  onClose: () => void;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContributionModal({ detail, onClose }: Props) {
  const [form, setForm] = useState<ContributionPayload>(() => buildInitialPayload(detail));
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [prUrl, setPrUrl] = useState('');

  const mode = detail.mode;
  const title = CONTRIBUTION_MODE_LABELS[mode];
  const requireImage = mode === 'suggest_holiday';

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && status !== 'submitting') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, status]);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm dark:bg-neutral-950/60"
        aria-label="Fechar"
        onClick={status === 'submitting' ? undefined : onClose}
        disabled={status === 'submitting'}
      />

      <div
        className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 sm:max-w-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contribution-modal-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4 dark:border-neutral-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Contribuir
            </p>
            <h2
              id="contribution-modal-title"
              className="mt-0.5 text-lg font-semibold text-neutral-900 dark:text-neutral-50"
            >
              {title}
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Suas alterações serão enviadas como pull request no GitHub para revisão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'submitting'}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50 dark:hover:bg-neutral-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          {status === 'success' ? (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-2">
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
                        className="text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                      >
                        Ver pull request no GitHub
                      </a>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <HolidayFields form={form} mode={mode} updateHoliday={updateHoliday} />
              <ArticleFields
                form={form}
                mode={mode}
                requireImage={requireImage}
                updateArticle={updateArticle}
                setError={setErrorMessage}
              />
              <ContributorFields form={form} updateField={updateField} />

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Nome e rede social só serão exibidos no site se a contribuição for aprovada.{' '}
                <a
                  href="/privacidade/"
                  className="text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                >
                  Política de privacidade
                </a>
              </p>

              {status === 'error' && errorMessage && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {errorMessage}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === 'submitting'}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  {status === 'submitting' ? 'Enviando…' : 'Enviar contribuição'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
