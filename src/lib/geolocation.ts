import { getStateByUf } from '@/lib/holidays';

export interface LocationResult {
  uf: string;
  stateName: string;
  stateSlug: string;
  cityName?: string;
}

interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  principalSubdivisionCode?: string;
  countryCode?: string;
}

interface StateBounds {
  uf: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const STATE_NAME_TO_UF: Record<string, string> = {
  Acre: 'AC',
  Alagoas: 'AL',
  Amazonas: 'AM',
  Amapá: 'AP',
  Bahia: 'BA',
  Ceará: 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  Goiás: 'GO',
  Maranhão: 'MA',
  'Minas Gerais': 'MG',
  'Mato Grosso do Sul': 'MS',
  'Mato Grosso': 'MT',
  Pará: 'PA',
  Paraíba: 'PB',
  Pernambuco: 'PE',
  Piauí: 'PI',
  Paraná: 'PR',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  Rondônia: 'RO',
  Roraima: 'RR',
  'Rio Grande do Sul': 'RS',
  'Santa Catarina': 'SC',
  Sergipe: 'SE',
  'São Paulo': 'SP',
  Tocantins: 'TO',
};

const STATE_BOUNDS: StateBounds[] = [
  { uf: 'AC', minLat: -11.5, maxLat: -7.0, minLng: -74.0, maxLng: -66.6 },
  { uf: 'AL', minLat: -10.5, maxLat: -8.8, minLng: -38.2, maxLng: -35.1 },
  { uf: 'AM', minLat: -9.8, maxLat: 2.2, minLng: -73.8, maxLng: -56.1 },
  { uf: 'AP', minLat: -1.2, maxLat: 4.5, minLng: -54.9, maxLng: -49.9 },
  { uf: 'BA', minLat: -18.5, maxLat: -8.5, minLng: -46.6, maxLng: -37.3 },
  { uf: 'CE', minLat: -7.9, maxLat: -2.8, minLng: -41.4, maxLng: -37.2 },
  { uf: 'DF', minLat: -16.1, maxLat: -15.5, minLng: -48.3, maxLng: -47.3 },
  { uf: 'ES', minLat: -21.3, maxLat: -17.9, minLng: -41.9, maxLng: -39.6 },
  { uf: 'GO', minLat: -19.5, maxLat: -12.4, minLng: -53.3, maxLng: -45.9 },
  { uf: 'MA', minLat: -10.3, maxLat: -1.0, minLng: -48.8, maxLng: -41.8 },
  { uf: 'MG', minLat: -22.9, maxLat: -14.2, minLng: -51.1, maxLng: -39.9 },
  { uf: 'MS', minLat: -24.1, maxLat: -17.2, minLng: -58.2, maxLng: -50.9 },
  { uf: 'MT', minLat: -18.0, maxLat: -7.3, minLng: -61.6, maxLng: -50.2 },
  { uf: 'PA', minLat: -9.8, maxLat: 2.6, minLng: -58.9, maxLng: -46.0 },
  { uf: 'PB', minLat: -8.3, maxLat: -6.0, minLng: -38.8, maxLng: -34.8 },
  { uf: 'PE', minLat: -9.5, maxLat: -7.3, minLng: -41.4, maxLng: -34.8 },
  { uf: 'PI', minLat: -11.1, maxLat: -4.9, minLng: -45.7, maxLng: -40.4 },
  { uf: 'PR', minLat: -26.7, maxLat: -22.5, minLng: -54.6, maxLng: -48.0 },
  { uf: 'RJ', minLat: -23.4, maxLat: -20.8, minLng: -44.9, maxLng: -40.9 },
  { uf: 'RN', minLat: -6.9, maxLat: -4.8, minLng: -38.6, maxLng: -34.9 },
  { uf: 'RO', minLat: -13.7, maxLat: -7.9, minLng: -66.8, maxLng: -59.8 },
  { uf: 'RR', minLat: -1.6, maxLat: 5.3, minLng: -64.8, maxLng: -58.9 },
  { uf: 'RS', minLat: -33.8, maxLat: -27.1, minLng: -57.7, maxLng: -49.7 },
  { uf: 'SC', minLat: -29.4, maxLat: -25.9, minLng: -53.8, maxLng: -48.4 },
  { uf: 'SE', minLat: -11.6, maxLat: -9.5, minLng: -38.2, maxLng: -36.4 },
  { uf: 'SP', minLat: -25.4, maxLat: -19.8, minLng: -53.1, maxLng: -44.0 },
  { uf: 'TO', minLat: -13.5, maxLat: -5.2, minLng: -50.7, maxLng: -45.7 },
];

function mapUFToResult(uf: string, cityName?: string): LocationResult | null {
  const state = getStateByUf(uf);
  if (!state) return null;
  const result: LocationResult = {
    uf: state.uf,
    stateName: state.name,
    stateSlug: state.slug,
  };
  if (cityName) result.cityName = cityName;
  return result;
}

function getUFFromBoundingBox(lat: number, lng: number): string | null {
  const matches = STATE_BOUNDS.filter(
    (b) => lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng,
  );
  if (matches.length === 1) return matches[0]?.uf ?? null;
  if (matches.length > 1) {
    const area = (b: StateBounds) => (b.maxLat - b.minLat) * (b.maxLng - b.minLng);
    matches.sort((a, b) => area(a) - area(b));
    return matches[0]?.uf ?? null;
  }
  return null;
}

interface GeocodeData {
  uf: string | null;
  cityName?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodeData> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('localityLanguage', 'pt');

    const response = await fetch(url.toString());
    if (!response.ok) {
      return { uf: getUFFromBoundingBox(lat, lng) };
    }

    const data = (await response.json()) as ReverseGeocodeResponse;
    if (data.countryCode !== 'BR') {
      return { uf: getUFFromBoundingBox(lat, lng) };
    }

    let uf: string | null = null;
    const code = data.principalSubdivisionCode;
    if (code?.startsWith('BR-')) {
      uf = code.slice(3);
    } else if (data.principalSubdivision) {
      uf = STATE_NAME_TO_UF[data.principalSubdivision] ?? null;
    }

    if (!uf) {
      uf = getUFFromBoundingBox(lat, lng);
    }

    const cityName = data.city ?? data.locality;
    return {
      uf,
      ...(cityName ? { cityName } : {}),
    };
  } catch {
    return { uf: getUFFromBoundingBox(lat, lng) };
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 15000,
      maximumAge: 120000,
      enableHighAccuracy: true,
    });
  });
}

export async function detectUserLocation(): Promise<LocationResult | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const { uf, cityName } = await reverseGeocode(latitude, longitude);
    return uf ? mapUFToResult(uf, cityName) : null;
  } catch {
    return null;
  }
}

/** @deprecated Use detectUserLocation */
export const detectUserState = detectUserLocation;

export type GeolocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }
  if (!navigator.permissions) {
    return 'prompt';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
      return status.state;
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function hasGeolocationPermission(): Promise<boolean> {
  const state = await getGeolocationPermissionState();
  return state === 'granted';
}
