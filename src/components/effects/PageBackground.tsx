import Starfield from '@/components/effects/Starfield';

interface Props {
  variant?: 'home' | 'default';
}

export default function PageBackground({ variant = 'default' }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--bg-base)]"
      aria-hidden="true"
    >
      <Starfield />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-base)]/80" />
      {variant === 'home' && (
        <>
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/5" />
          <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/5" />
        </>
      )}
    </div>
  );
}
