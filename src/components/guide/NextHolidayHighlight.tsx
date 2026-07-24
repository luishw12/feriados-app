interface Props {
  name: string;
  formattedDate: string;
  holidayId: string;
}

export default function NextHolidayHighlight({ name, formattedDate, holidayId }: Props) {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
        Próximo feriado nacional
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        {name}
      </p>
      <p className="mt-1 capitalize text-neutral-600 dark:text-neutral-400">{formattedDate}</p>
      <a
        href={`/feriado/${holidayId}/`}
        className="mt-5 inline-flex text-sm font-medium text-emerald-700 transition-colors duration-150 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        Ver história e detalhes
        <span className="ml-1.5" aria-hidden="true">
          →
        </span>
      </a>
    </div>
  );
}
