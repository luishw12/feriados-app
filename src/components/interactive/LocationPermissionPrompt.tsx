import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MapPin } from 'lucide-react';
import type { GeolocationPermissionState } from '@/lib/geolocation';

type PromptStatus = 'idle' | 'loading' | 'error';

interface Props {
  permissionState: GeolocationPermissionState;
  status: PromptStatus;
  errorMessage: string | null;
  onAllow: () => void;
  onDismiss: () => void;
}

const ACCEPT_BENEFITS = [
  'Detectamos seu estado e, quando possível, sua cidade',
  'O calendário na home destaca feriados estaduais e municipais da sua região',
  'O countdown considera os feriados da sua localização',
  'Coordenadas usadas só no navegador para identificar a região',
];

const DECLINE_EFFECTS = [
  'Você vê apenas os feriados nacionais no calendário',
  'Feriados regionais ficam visíveis, porém sem destaque personalizado',
  'Pode escolher estado e cidade manualmente pelo ícone de localização no topo da home',
];

export default function LocationPermissionPrompt({
  permissionState,
  status,
  errorMessage,
  onAllow,
  onDismiss,
}: Props) {
  const allowButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    allowButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const primaryLabel =
    permissionState === 'denied' ? 'Tentar novamente' : 'Permitir localização';

  const content = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm dark:bg-neutral-950/70"
        aria-hidden="true"
      />

      <div
        className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 sm:max-w-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-prompt-title"
      >
        <div className="border-b border-neutral-100 px-5 py-5 dark:border-neutral-800 sm:px-6">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              aria-hidden="true"
            >
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="location-prompt-title"
                className="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
              >
                Personalize seus feriados
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Permita o acesso à localização para ver feriados da sua região no calendário.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <section>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Se você aceitar a localização
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {ACCEPT_BENEFITS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Se você continuar sem localização
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {DECLINE_EFFECTS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {permissionState === 'denied' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              A localização está bloqueada no navegador. Para habilitar, abra as configurações do
              site no ícone ao lado da URL ou selecione manualmente na home.
            </p>
          )}

          {permissionState === 'unsupported' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              Seu navegador não suporta geolocalização. Você pode escolher estado e cidade
              manualmente na home.
            </p>
          )}

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-100 px-5 py-4 dark:border-neutral-800 sm:flex-row-reverse sm:px-6">
          <button
            ref={allowButtonRef}
            type="button"
            onClick={onAllow}
            disabled={status === 'loading' || permissionState === 'unsupported'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:w-auto"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Detectando...
              </>
            ) : (
              primaryLabel
            )}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={status === 'loading'}
            className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 sm:w-auto"
          >
            Continuar sem localização
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
