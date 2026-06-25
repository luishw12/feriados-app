import { useCallback, useEffect, useState } from 'react';
import LocationPermissionPrompt from '@/components/interactive/LocationPermissionPrompt';
import { buildContextFromDetection } from '@/lib/location-context';
import { loadMunicipalityIndex } from '@/lib/municipality-index';
import {
  detectUserLocation,
  getGeolocationPermissionState,
  type GeolocationPermissionState,
} from '@/lib/geolocation';
import {
  dismissLocationPrompt,
  getLocationLabel,
  loadStoredLocationContext,
  isLocationPromptDismissed,
  saveStoredLocation,
} from '@/lib/location-storage';

type PromptStatus = 'idle' | 'loading' | 'error';

export default function LocationPermissionGate() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>('prompt');
  const [status, setStatus] = useState<PromptStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const saveDetectedLocation = useCallback(async (): Promise<boolean> => {
    const result = await detectUserLocation();
    if (!result) return false;

    try {
      const municipalities = await loadMunicipalityIndex();
      const context = buildContextFromDetection(result, municipalities);
      saveStoredLocation(context, getLocationLabel(context));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (loadStoredLocationContext() || isLocationPromptDismissed()) {
        if (!cancelled) setInitialized(true);
        return;
      }

      const state = await getGeolocationPermissionState();
      if (cancelled) return;

      setPermissionState(state);

      if (state === 'granted') {
        const saved = await saveDetectedLocation();
        if (!cancelled) setInitialized(true);
        if (!cancelled && !saved) {
          setShowPrompt(true);
        }
        return;
      }

      if (!cancelled) {
        setShowPrompt(true);
        setInitialized(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [saveDetectedLocation]);

  const handleAllow = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    const saved = await saveDetectedLocation();
    if (saved) {
      setShowPrompt(false);
      setStatus('idle');
      return;
    }

    const nextState = await getGeolocationPermissionState();
    setPermissionState(nextState);
    setStatus('error');
    setErrorMessage(
      nextState === 'denied'
        ? 'Permissão negada. Libere a localização nas configurações do navegador ou continue sem.'
        : 'Não foi possível detectar sua localização. Tente novamente ou continue sem.',
    );
  }, [saveDetectedLocation]);

  const handleDismiss = useCallback(() => {
    dismissLocationPrompt();
    setShowPrompt(false);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  if (!initialized || !showPrompt) {
    return null;
  }

  return (
    <LocationPermissionPrompt
      permissionState={permissionState}
      status={status}
      errorMessage={errorMessage}
      onAllow={handleAllow}
      onDismiss={handleDismiss}
    />
  );
}
