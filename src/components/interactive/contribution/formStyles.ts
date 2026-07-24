import { cn } from '@/lib/utils';

export const fieldControlClass = 'w-full';

export const labelClass =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground';

export const hintClass = 'mt-1.5 text-xs text-muted-foreground';

export function controlClassName(...classes: Array<string | false | null | undefined>): string {
  return cn(fieldControlClass, ...classes);
}
