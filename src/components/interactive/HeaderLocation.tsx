import { useCallback, useEffect, useState } from 'react';
import LocationPicker from '@/components/interactive/LocationPicker';
import type { StateOption } from '@/lib/municipality-search';
import {
  loadStoredLocationContext,
  subscribeLocationUpdated,
  type LocationContext,
} from '@/lib/location-storage';

interface Props {
  states: StateOption[];
}

export default function HeaderLocation({ states }: Props) {
  // Inicia null para casar com o HTML do servidor (sem localStorage) e só então
  // carrega a localização salva, evitando divergência de hidratação no rótulo.
  const [location, setLocation] = useState<LocationContext | null>(null);

  useEffect(() => {
    setLocation(loadStoredLocationContext());
    return subscribeLocationUpdated(() => setLocation(loadStoredLocationContext()));
  }, []);

  // LocationPicker já persiste no storage e dispara o evento de atualização;
  // aqui apenas refletimos a mudança no estado local para o rótulo do botão.
  const handleLocationChange = useCallback((next: LocationContext | null) => {
    setLocation(next);
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
