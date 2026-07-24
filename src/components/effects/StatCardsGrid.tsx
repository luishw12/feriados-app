import BorderGlowShell from '@/components/effects/BorderGlowShell';

export interface StatCardItem {
  value: number | string;
  label: string;
}

interface Props {
  items: StatCardItem[];
  className?: string;
}

export default function StatCardsGrid({ items, className }: Props) {
  return (
    <section
      className={['grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className].filter(Boolean).join(' ')}
      aria-label="Estatísticas"
    >
      {items.map((item) => (
        <BorderGlowShell key={item.label} contentClassName="p-4">
          <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {item.value}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</p>
        </BorderGlowShell>
      ))}
    </section>
  );
}
