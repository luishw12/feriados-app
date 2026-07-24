import { useCallback, useEffect, useState } from 'react';
import LocationAccuracyHint from '@/components/interactive/LocationAccuracyHint';
import { buildContextFromDetection } from '@/lib/location-context';
import { loadMunicipalityIndex } from '@/lib/municipality-index';
import {
  detectUserLocation,
  getGeolocationPermissionState,
  type GeolocationPermissionState,
} from '@/lib/geolocation';
import {
  dismissLocationMismatch,
  dismissLocationPrompt,
  getLocationLabel,
  hasLocationMismatch,
  isLocationAutoAsked,
  isLocationPromptDismissed,
  isMismatchDismissed,
  loadBrowserLocation,
  loadStoredLocationContext,
  markLocationAutoAsked,
  saveBrowserLocation,
  saveDetectedLocations,
  subscribeLocationUpdated,
  type LocationContext,
} from '@/lib/location-storage';

type HintKind = 'permission' | 'mismatch';

interface Props {
  showLocationSuggestion?: boolean;
}

export default function LocationPermissionGate({
  showLocationSuggestion = false,
}: Props) {
  const [hintKind, setHintKind] = useState<HintKind | null>(null);
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>('prompt');
  const [browserLocation, setBrowserLocation] = useState<LocationContext | null>(null);
  const [siteLocation, setSiteLocation] = useState<LocationContext | null>(null);

  const detectAndBuildContext = useCallback(async (): Promise<LocationContext | null> => {
    const result = await detectUserLocation();
    if (!result) return null;

    try {
      const municipalities = await loadMunicipalityIndex();
      return buildContextFromDetection(result, municipalities);
    } catch {
      return null;
    }
  }, []);

  const saveAsSiteAndBrowser = useCallback(
    async (): Promise<LocationContext | null> => {
      const context = await detectAndBuildContext();
      if (!context) return null;
      saveDetectedLocations(context, getLocationLabel(context));
      return context;
    },
    [detectAndBuildContext],
  );

  const syncMismatchHint = useCallback(() => {
    const site = loadStoredLocationContext();
    const browser = loadBrowserLocation();
    setSiteLocation(site);
    setBrowserLocation(browser);

    if (site && browser && hasLocationMismatch() && !isMismatchDismissed()) {
      setHintKind('mismatch');
      return;
    }

    // Com localização no site (ou alinhada ao navegador), some avisos de permission/mismatch.
    if (site) {
      setHintKind(null);
      return;
    }

    setHintKind((current) => (current === 'mismatch' ? null : current));
  }, []);

  useEffect(() => {
    if (!showLocationSuggestion) return undefined;
    return subscribeLocationUpdated(syncMismatchHint);
  }, [showLocationSuggestion, syncMismatchHint]);

  useEffect(() => {
    if (!showLocationSuggestion) return undefined;

    let cancelled = false;

    void (async () => {
      const site = loadStoredLocationContext();
      const cachedBrowser = loadBrowserLocation();
      if (cancelled) return;

      setSiteLocation(site);
      setBrowserLocation(cachedBrowser);

      // Já tem localização no site: não busca GPS de novo se o cache do navegador existir.
      if (site) {
        const state = await getGeolocationPermissionState();
        if (cancelled) return;
        setPermissionState(state);

        let browser = cachedBrowser;

        // Sem cache do navegador e permissão concedida: detecta uma vez e guarda.
        if (!browser && state === 'granted') {
          browser = await detectAndBuildContext();
          if (cancelled) return;
          if (browser) {
            saveBrowserLocation(browser);
            setBrowserLocation(browser);
          }
        }

        if (browser && hasLocationMismatch() && !isMismatchDismissed()) {
          setBrowserLocation(browser);
          setHintKind('mismatch');
        }
        return;
      }

      if (isLocationPromptDismissed()) return;

      // Já pedimos ao navegador antes: só reexibe o aviso discreto.
      if (isLocationAutoAsked()) {
        const state = await getGeolocationPermissionState();
        if (cancelled) return;
        setPermissionState(state);
        setHintKind('permission');
        return;
      }

      const state = await getGeolocationPermissionState();
      if (cancelled) return;

      setPermissionState(state);
      markLocationAutoAsked();

      if (state === 'unsupported' || state === 'denied') {
        setHintKind('permission');
        return;
      }

      // Pedir direto ao navegador (sem modal intermediário) e cachear.
      const saved = await saveAsSiteAndBrowser();
      if (cancelled) return;

      if (saved) {
        setSiteLocation(saved);
        setBrowserLocation(saved);
        return;
      }

      const nextState = await getGeolocationPermissionState();
      if (cancelled) return;

      setPermissionState(nextState);
      setHintKind('permission');
    })();

    return () => {
      cancelled = true;
    };
  }, [detectAndBuildContext, saveAsSiteAndBrowser, showLocationSuggestion]);

  const handleDismiss = useCallback(() => {
    if (hintKind === 'mismatch') {
      dismissLocationMismatch();
    } else {
      dismissLocationPrompt();
    }
    setHintKind(null);
  }, [hintKind]);

  const handleUseBrowserLocation = useCallback(() => {
    const browser = loadBrowserLocation() ?? browserLocation;
    if (!browser) return;
    saveDetectedLocations(browser, getLocationLabel(browser));
    setSiteLocation(browser);
    setBrowserLocation(browser);
    setHintKind(null);
  }, [browserLocation]);

  if (!showLocationSuggestion || !hintKind) {
    return null;
  }

  return (
    <LocationAccuracyHint
      kind={hintKind}
      permissionState={permissionState}
      siteLocation={siteLocation}
      browserLocation={browserLocation}
      onDismiss={handleDismiss}
      {...(hintKind === 'mismatch'
        ? { onUseBrowserLocation: handleUseBrowserLocation }
        : {})}
    />
  );
}
