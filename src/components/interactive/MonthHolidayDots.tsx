import type { HolidayType } from '@/data/schema';
import { HOLIDAY_TYPE_COLORS } from '@/lib/constants';

interface Props {
  types: HolidayType[];
  size?: 'sm' | 'md';
}

const MAX_COLORED_DOTS = 3;
const MAX_DOTS_BEFORE_OVERFLOW = 4;

export default function MonthHolidayDots({ types, size = 'md' }: Props) {
  if (types.length === 0) return null;

  const hasOverflow = types.length > MAX_DOTS_BEFORE_OVERFLOW;
  const coloredTypes = hasOverflow ? types.slice(0, MAX_COLORED_DOTS) : types;
  const overflowCount = hasOverflow ? types.length - MAX_COLORED_DOTS : 0;

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  const overlap = size === 'sm' ? '-ml-1' : '-ml-1.5';
  const border = 'border border-white dark:border-neutral-900';
  const overflowClass =
    size === 'sm'
      ? 'h-3 min-w-[0.75rem] px-0.5 text-[6px] leading-none'
      : 'h-3.5 min-w-[0.875rem] px-0.5 text-[7px] leading-none';

  return (
    <span
      className="inline-flex items-center"
      aria-label={`${types.length} feriados neste mês`}
    >
      {coloredTypes.map((type, index) => (
        <span
          key={`${type}-${index}`}
          className={[
            'relative inline-block shrink-0 rounded-full',
            dotSize,
            border,
            HOLIDAY_TYPE_COLORS[type].dot,
            index > 0 ? overlap : '',
          ].join(' ')}
          style={{ zIndex: index }}
          aria-hidden="true"
        />
      ))}
      {overflowCount > 0 && (
        <span
          className={[
            'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
            overflowClass,
            border,
            'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200',
            coloredTypes.length > 0 ? overlap : '',
          ].join(' ')}
          style={{ zIndex: coloredTypes.length }}
          aria-hidden="true"
        >
          +{overflowCount}
        </span>
      )}
    </span>
  );
}
