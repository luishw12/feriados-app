import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  active?: boolean;
}

export default function BorderGlow({
  children,
  className,
  contentClassName,
  active = true,
}: Props) {
  return (
    <div className={cn('relative rounded-2xl p-px', active && 'border-glow', className)}>
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-[calc(1rem-1px)] bg-white/85 backdrop-blur-md dark:bg-neutral-950/85',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
