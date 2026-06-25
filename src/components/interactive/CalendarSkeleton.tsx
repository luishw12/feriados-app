export default function CalendarSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 animate-pulse gap-4 lg:gap-5"
      aria-busy="true"
      aria-label="Carregando calendário"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mb-3 flex shrink-0 gap-2">
          <div className="h-9 w-28 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <div className="mb-3 h-4 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />

        <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`weekday-${index}`}
              className="mx-auto h-3 w-6 rounded bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>

        <div className="grid shrink-0 grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={`day-${index}`}
              className="aspect-square min-h-11 rounded-lg bg-neutral-200 dark:bg-neutral-800 sm:min-h-0"
            />
          ))}
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2">
          <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`card-${index}`}
              className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>

      <aside className="hidden w-48 shrink-0 flex-col gap-2 xl:w-52 lg:flex">
        <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`mini-${index}`}
            className="h-24 rounded-xl bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </aside>
    </div>
  );
}
