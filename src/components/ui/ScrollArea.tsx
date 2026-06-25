import type { HTMLAttributes, ReactNode } from 'react';

type ScrollOrientation = 'vertical' | 'horizontal' | 'both';

interface ScrollAreaProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  orientation?: ScrollOrientation;
  as?: 'div' | 'nav' | 'section';
}

const orientationClasses: Record<ScrollOrientation, string> = {
  vertical: 'scroll-area-y',
  horizontal: 'scroll-area-x',
  both: 'scroll-area-both',
};

export default function ScrollArea({
  as: Component = 'div',
  children,
  className = '',
  orientation = 'vertical',
  ...rest
}: ScrollAreaProps) {
  return (
    <Component
      className={['scroll-area', orientationClasses[orientation], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Component>
  );
}
