import { MapPin, X } from 'lucide-react';
import type { GeolocationPermissionState } from '@/lib/geolocation';
import { getLocationLabel, type LocationContext } from '@/lib/location-storage';

interface Props {
  kind?: 'permission' | 'mismatch';
  permissionState: GeolocationPermissionState;
  siteLocation?: LocationContext | null;
  browserLocation?: LocationContext | null;
  onDismiss: () => void;
  onUseBrowserLocation?: () => void;
}

export default function LocationAccuracyHint({
  kind = 'permission',
  permissionState,
  siteLocation = null,
  browserLocation = null,
  onDismiss,
  onUseBrowserLocation,
}: Props) {
  const siteLabel = getLocationLabel(siteLocation);
  const browserLabel = getLocationLabel(browserLocation);

  const message =
    kind === 'mismatch'
      ? `O site está em ${siteLabel}, mas o navegador indica ${browserLabel}.`
      : permissionState === 'unsupported'
        ? 'Seu navegador não suporta geolocalização. Escolha estado e cidade no topo para ver feriados regionais.'
        : permissionState === 'denied'
          ? 'Localização desativada. O calendário fica mais preciso para a sua região se você liberar no navegador ou escolher manualmente no topo.'
          : 'O calendário fica mais preciso com a sua localização. Escolha estado e cidade no topo quando quiser.';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-14 z-30 flex justify-center px-3 pt-2 animate-fade-in"
    >
      <div className="pointer-events-auto flex max-w-xl items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/95 px-3 py-2 shadow-sm backdrop-blur-md dark:border-amber-900/40 dark:bg-amber-950/85">
        <MapPin
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200 sm:text-[13px]">
            {message}
          </p>
          {kind === 'mismatch' && onUseBrowserLocation && (
            <button
              type="button"
              onClick={onUseBrowserLocation}
              className="rounded-md bg-amber-700/90 px-2 py-1 text-xs font-medium text-white transition-colors duration-150 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              Usar localização do navegador
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-amber-700/70 transition-colors duration-150 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400/70 dark:hover:bg-amber-900/50 dark:hover:text-amber-200"
          aria-label="Dispensar aviso de localização"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
