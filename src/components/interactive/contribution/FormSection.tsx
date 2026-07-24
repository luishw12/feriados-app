import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Layout plano para uso dentro de tabs (sem card). */
  bare?: boolean;
}

export default function FormSection({
  title,
  description,
  children,
  className,
  bare = false,
}: Props) {
  return (
    <section className={cn(!bare && 'rounded-2xl glass-panel p-4 sm:p-5', className)}>
      {(title || description) && (
        <div
          className={cn(
            'mb-4',
            !bare && 'border-b border-indigo-300/20 pb-3 dark:border-indigo-400/15',
          )}
        >
          {title && (
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">{children}</div>
    </section>
  );
}
