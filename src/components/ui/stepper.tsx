import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, currentIndex, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-start gap-1', className)} aria-label="Progresso do formulário">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className={cn('flex min-w-0 flex-1 items-start', isLast && 'flex-none')}>
            <button
              type="button"
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'group flex min-w-0 flex-1 flex-col items-center gap-2 text-left disabled:cursor-default',
                onStepClick && 'cursor-pointer',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent &&
                    'border-primary bg-primary/15 text-primary shadow-[0_0_0_4px] shadow-primary/15',
                  !isCompleted &&
                    !isCurrent &&
                    'border-border bg-background text-muted-foreground group-hover:border-primary/40',
                )}
              >
                {isCompleted ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'w-full truncate text-center text-xs font-medium',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div
                className={cn(
                  'mx-1 mt-4 hidden h-0.5 min-w-4 flex-1 sm:block',
                  index < currentIndex ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
