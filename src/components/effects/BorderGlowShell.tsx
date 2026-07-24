import type { ReactNode } from 'react';
import MouseBorderGlow from '@/components/effects/MouseBorderGlow';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  href?: string;
  external?: boolean;
}

export default function BorderGlowShell({
  children,
  className,
  contentClassName,
  href,
  external = false,
}: Props) {
  const card = (
    <MouseBorderGlow className={className} contentClassName={contentClassName}>
      {children}
    </MouseBorderGlow>
  );

  if (href) {
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="block transition-transform duration-200 hover:-translate-y-0.5"
      >
        {card}
      </a>
    );
  }

  return card;
}
