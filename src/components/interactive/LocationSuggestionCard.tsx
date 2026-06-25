import { Loader2, MapPin, X } from 'lucide-react';
import type { GeolocationPermissionState } from '@/lib/geolocation';

type PromptStatus = 'idle' | 'loading' | 'error';

interface Props {
  permissionState: GeolocationPermissionState;
  status: PromptStatus;
  errorMessage: string | null;
  onAllow: () => void;
  onDismiss: () => void;
}

export default function LocationSuggestionCard({
  permissionState,
  status,
  errorMessage,
  onAllow,
  onDismiss,
}: Props) {
  const primaryLabel =
    permissionState === 'denied' ? 'Tentar novamente' : 'Ativar localização';

  return (
    <div
      role="region"
      aria-labelledby="location-suggestion-title"
      className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-xs rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          aria-hidden="true"
        >
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2
              id="location-suggestion-title"
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
            >
              Feriados da sua região
            </h2>
            <button
              type="button"
              onClick={onDismiss}
              disabled={status === 'loading'}
              className="shrink-0 rounded-md p-0.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              aria-label="Fechar sugestão de localização"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Ative a localização para destacar feriados estaduais e municipais no calendário.
          </p>
        </div>
      </div>

      <div aria-live="polite" className="mt-3 space-y-2">
        {permissionState === 'denied' && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            Localização bloqueada. Libere nas configurações do navegador ou escolha manualmente no
            topo.
          </p>
        )}

        {permissionState === 'unsupported' && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            Seu navegador não suporta geolocalização. Escolha estado e cidade no topo da página.
          </p>
        )}

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onAllow}
          disabled={status === 'loading' || permissionState === 'unsupported'}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
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
          className="text-xs font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
