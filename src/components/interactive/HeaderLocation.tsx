import { useCallback } from 'react';
import LocationPicker from '@/components/interactive/LocationPicker';
import type { StateOption } from '@/lib/municipality-search';
import type { LocationContext } from '@/lib/location-storage';
import { useStoredLocationContext } from '@/lib/use-stored-location';

interface Props {
  states: StateOption[];
}

export default function HeaderLocation({ states }: Props) {
  const location = useStoredLocationContext();

  const handleLocationChange = useCallback((_next: LocationContext | null) => {
    // LocationPicker persiste no storage e dispara LOCATION_UPDATED_EVENT;
    // useStoredLocationContext reage via useSyncExternalStore.
  }, []);

  return (
    <LocationPicker
      states={states}
      location={location}
      onLocationChange={handleLocationChange}
      variant="header"
    />
  );
}
