import { useSyncExternalStore } from 'react';
import {
  loadStoredLocationContext,
  subscribeLocationUpdated,
  type LocationContext,
} from '@/lib/location-storage';

export function useStoredLocationContext(): LocationContext | null {
  return useSyncExternalStore(
    subscribeLocationUpdated,
    loadStoredLocationContext,
    () => null,
  );
}
