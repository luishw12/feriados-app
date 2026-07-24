import { useSyncExternalStore } from 'react';
import { getThemeSnapshot, subscribeThemeUpdated } from '@/lib/theme-storage';

export function useTheme(): boolean {
  return useSyncExternalStore(subscribeThemeUpdated, getThemeSnapshot, () => false);
}
