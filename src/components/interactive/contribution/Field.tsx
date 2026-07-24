import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { hintClass } from '@/components/interactive/contribution/formStyles';

interface Props {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export default function Field({ label, htmlFor, required, hint, className, children }: Props) {
  return (
    <div className={cn('min-w-0', className)}>
      <Label htmlFor={htmlFor} className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? ' *' : ''}
      </Label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}
