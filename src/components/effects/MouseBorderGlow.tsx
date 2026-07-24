import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  proximity?: number;
}

export default function MouseBorderGlow({
  children,
  className,
  contentClassName,
  proximity = 64,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState<{ x: number; y: number; intensity: number } | null>(null);

  const handleMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const distLeft = x;
      const distRight = rect.width - x;
      const distTop = y;
      const distBottom = rect.height - y;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist <= proximity) {
        const intensity = 1 - minDist / proximity;
        setGlow({ x, y, intensity });
        return;
      }

      setGlow(null);
    },
    [proximity],
  );

  const handleLeave = useCallback(() => {
    setGlow(null);
  }, []);

  const isActive = glow !== null;

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl p-[1.5px] transition-shadow duration-200',
        !isActive && 'bg-neutral-200/40 dark:bg-neutral-700/50',
        isActive && 'shadow-glow',
        className,
      )}
      style={
        isActive
          ? {
              background: `radial-gradient(${180 + glow.intensity * 60}px circle at ${glow.x}px ${glow.y}px, rgb(52,211,153) 0%, rgb(96,165,250) 28%, rgb(192,132,252) 42%, rgba(15,23,42,0.4) 58%, transparent 72%)`,
            }
          : undefined
      }
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-[calc(1rem-1.5px)] bg-[#eef2ff]/35 backdrop-blur-xl dark:bg-[#0a0f1e]/70',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
