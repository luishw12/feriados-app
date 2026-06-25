import { findMunicipalityByName } from '@/lib/municipality-match';
import type { LocationContext } from '@/lib/location-storage';
import type { LocationResult } from '@/lib/geolocation';

interface MunicipalityOption {
  slug: string;
  name: string;
  uf: string;
}

export function buildContextFromDetection(
  result: LocationResult,
  municipalities: MunicipalityOption[],
): LocationContext {
  const city = result.cityName
    ? findMunicipalityByName(result.cityName, result.uf, municipalities)
    : undefined;

  const context: LocationContext = {
    uf: result.uf,
    stateName: result.stateName,
    stateSlug: result.stateSlug,
  };

  if (city) {
    context.citySlug = city.slug;
    context.cityName = city.name;
  }

  return context;
}
