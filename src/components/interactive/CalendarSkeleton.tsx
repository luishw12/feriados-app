export default function CalendarSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 animate-pulse flex-col gap-3 overflow-hidden lg:gap-4"
      aria-busy="true"
      aria-label="Carregando calendário"
    >
      <div className="shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="space-y-1">
              <div className="h-7 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-7 w-7 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-7 w-7 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1 sm:grid-cols-12 sm:gap-1.5">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`month-${index}`}
              className="h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 sm:h-14 sm:rounded-xl"
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden lg:gap-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200/60 p-3 dark:border-neutral-800/60">
          <div className="mb-1.5 grid shrink-0 grid-cols-7 gap-1 sm:mb-2 sm:gap-1.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={`weekday-${index}`} className="h-4 rounded bg-neutral-200 dark:bg-neutral-800" />
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-7 auto-rows-fr gap-1 sm:gap-1.5">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={`day-${index}`}
                className="min-h-0 rounded-lg bg-neutral-200 dark:bg-neutral-800 sm:rounded-xl"
              />
            ))}
          </div>
        </div>

        <aside className="hidden w-72 shrink-0 overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 lg:block xl:w-80">
          <div className="border-b border-neutral-200/60 p-3 dark:border-neutral-800/60">
            <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-3 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="space-y-3 p-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`card-${index}`}
                className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-800"
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
