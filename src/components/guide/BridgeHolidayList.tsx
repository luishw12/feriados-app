export interface BridgeHolidayItem {
  id: string;
  name: string;
  formattedDate: string;
  description: string;
}

interface Props {
  items: BridgeHolidayItem[];
}

export default function BridgeHolidayList({ items }: Props) {
  return (
    <ul className="divide-y divide-neutral-200/80 border-y border-neutral-200/80 dark:divide-neutral-800 dark:border-neutral-800">
      {items.map((holiday) => (
        <li key={holiday.id} className="py-5">
          <a
            href={`/feriado/${holiday.id}/`}
            className="font-medium text-emerald-700 transition-colors duration-150 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {holiday.name}
          </a>
          <p className="mt-1 text-sm capitalize text-neutral-600 dark:text-neutral-400">
            {holiday.formattedDate}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
            {holiday.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
