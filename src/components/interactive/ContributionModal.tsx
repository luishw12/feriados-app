import { useEffect, useState, type FormEvent } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type {
  ContributionMode,
  ContributionOpenDetail,
  ContributionPayload,
  HolidayScope,
  SocialPlatform,
} from '@/lib/contributions';
import {
  CONTRIBUTION_MODE_LABELS,
  HOLIDAY_SCOPES,
  SOCIAL_PLATFORMS,
  submitContribution,
} from '@/lib/contributions';

interface Props {
  detail: ContributionOpenDetail;
  onClose: () => void;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder:text-neutral-500';

const labelClass = 'mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

function buildInitialPayload(detail: ContributionOpenDetail): ContributionPayload {
  return {
    type: detail.mode,
    holidayName: detail.holidayName ?? '',
    holidayId: detail.holidayId,
    pageUrl: detail.pageUrl ?? (typeof window !== 'undefined' ? window.location.href : ''),
    scope: 'national',
    state: '',
    city: '',
    date: '',
    description: '',
    message: '',
    source: '',
    contributorName: '',
    contributorSocialPlatform: undefined,
    contributorSocialUrl: '',
    website: '',
  };
}

export default function ContributionModal({ detail, onClose }: Props) {
  const [form, setForm] = useState<ContributionPayload>(() => buildInitialPayload(detail));
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [issueUrl, setIssueUrl] = useState('');

  const mode = detail.mode;
  const title = CONTRIBUTION_MODE_LABELS[mode];

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const result = await submitContribution(form);

    if (!result.ok) {
      setStatus('error');
      setErrorMessage(result.error);
      return;
    }

    setStatus('success');
    if (result.issueUrl) setIssueUrl(result.issueUrl);
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
        className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 sm:max-w-lg sm:rounded-2xl"
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
                  Recebemos sua sugestão e vamos analisá-la em breve.
                  {issueUrl && (
                    <>
                      {' '}
                      <a
                        href={issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                      >
                        Acompanhar no GitHub
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
              {mode === 'suggest_holiday' ? (
                <SuggestHolidayFields form={form} updateField={updateField} />
              ) : (
                <ExistingHolidayFields form={form} mode={mode} updateField={updateField} />
              )}

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

interface FieldProps {
  form: ContributionPayload;
  updateField: <K extends keyof ContributionPayload>(key: K, value: ContributionPayload[K]) => void;
}

function SuggestHolidayFields({ form, updateField }: FieldProps) {
  return (
    <>
      <div>
        <label htmlFor="holiday-name" className={labelClass}>
          Nome do feriado *
        </label>
        <input
          id="holiday-name"
          type="text"
          required
          className={inputClass}
          value={form.holidayName ?? ''}
          onChange={(e) => updateField('holidayName', e.target.value)}
          placeholder="Ex.: Revolução Farroupilha"
        />
      </div>
      <div>
        <label htmlFor="scope" className={labelClass}>
          Escopo *
        </label>
        <select
          id="scope"
          required
          className={inputClass}
          value={form.scope ?? 'national'}
          onChange={(e) => updateField('scope', e.target.value as HolidayScope)}
        >
          {HOLIDAY_SCOPES.map((scope) => (
            <option key={scope.value} value={scope.value}>
              {scope.label}
            </option>
          ))}
        </select>
      </div>
      {form.scope !== 'national' && (
        <div>
          <label htmlFor="state" className={labelClass}>
            Estado (UF) *
          </label>
          <input
            id="state"
            type="text"
            required
            maxLength={2}
            className={inputClass}
            value={form.state ?? ''}
            onChange={(e) => updateField('state', e.target.value.toUpperCase())}
            placeholder="RS"
          />
        </div>
      )}
      {form.scope === 'municipal' && (
        <div>
          <label htmlFor="city" className={labelClass}>
            Cidade *
          </label>
          <input
            id="city"
            type="text"
            required
            className={inputClass}
            value={form.city ?? ''}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Porto Alegre"
          />
        </div>
      )}
      <div>
        <label htmlFor="date" className={labelClass}>
          Data *
        </label>
        <input
          id="date"
          type="text"
          required
          className={inputClass}
          value={form.date ?? ''}
          onChange={(e) => updateField('date', e.target.value)}
          placeholder="DD/MM ou descrição para feriados móveis"
        />
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          value={form.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Breve descrição do feriado (opcional)"
        />
      </div>
      <SourceField form={form} updateField={updateField} />
    </>
  );
}

function ExistingHolidayFields({
  form,
  mode,
  updateField,
}: FieldProps & { mode: ContributionMode }) {
  return (
    <>
      <div>
        <label htmlFor="holiday-readonly" className={labelClass}>
          Feriado
        </label>
        <input
          id="holiday-readonly"
          type="text"
          readOnly
          className={`${inputClass} bg-neutral-50 dark:bg-neutral-900`}
          value={form.holidayName ?? ''}
        />
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>
          {mode === 'report_error' ? 'O que está incorreto? *' : 'Informação adicional *'}
        </label>
        <textarea
          id="message"
          required
          rows={4}
          className={inputClass}
          value={form.message ?? ''}
          onChange={(e) => updateField('message', e.target.value)}
          placeholder={
            mode === 'report_error'
              ? 'Descreva o erro encontrado (data, nome, escopo…)'
              : 'Tradições, história, curiosidades ou outras informações relevantes'
          }
        />
      </div>
      <SourceField form={form} updateField={updateField} />
    </>
  );
}

function SourceField({ form, updateField }: FieldProps) {
  return (
    <div>
      <label htmlFor="source" className={labelClass}>
        Fonte oficial *
      </label>
      <textarea
        id="source"
        required
        rows={2}
        className={inputClass}
        value={form.source}
        onChange={(e) => updateField('source', e.target.value)}
        placeholder="Lei, decreto, site do governo ou outra fonte confiável"
      />
    </div>
  );
}

function ContributorFields({ form, updateField }: FieldProps) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
      <legend className="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Crédito público (opcional)
      </legend>
      <div>
        <label htmlFor="contributor-name" className={labelClass}>
          Seu nome
        </label>
        <input
          id="contributor-name"
          type="text"
          className={inputClass}
          value={form.contributorName ?? ''}
          onChange={(e) => updateField('contributorName', e.target.value)}
          placeholder="Como deseja ser creditado"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="social-platform" className={labelClass}>
            Rede social
          </label>
          <select
            id="social-platform"
            className={inputClass}
            value={form.contributorSocialPlatform ?? ''}
            onChange={(e) =>
              updateField(
                'contributorSocialPlatform',
                e.target.value ? (e.target.value as SocialPlatform) : undefined,
              )
            }
          >
            <option value="">Selecione…</option>
            {SOCIAL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="social-url" className={labelClass}>
            Link do perfil
          </label>
          <input
            id="social-url"
            type="url"
            className={inputClass}
            value={form.contributorSocialUrl ?? ''}
            onChange={(e) => updateField('contributorSocialUrl', e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
      </div>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
        value={form.website ?? ''}
        onChange={(e) => updateField('website', e.target.value)}
        aria-hidden="true"
      />
    </fieldset>
  );
}
