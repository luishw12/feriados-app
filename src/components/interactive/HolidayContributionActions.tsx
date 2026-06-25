import { openContributionModal } from '@/lib/contributions';

interface Props {
  holidayId: string;
  holidayName: string;
  pageUrl: string;
}

export default function HolidayContributionActions({ holidayId, holidayName, pageUrl }: Props) {
  function openReportError() {
    openContributionModal({
      mode: 'report_error',
      holidayId,
      holidayName,
      pageUrl,
    });
  }

  function openEnrichContent() {
    openContributionModal({
      mode: 'enrich_content',
      holidayId,
      holidayName,
      pageUrl,
    });
  }

  return (
    <section className="space-y-3 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        Ajude a melhorar este artigo
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Encontrou algo incorreto ou tem informações para enriquecer este conteúdo? Conte para nós.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openReportError}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-red-300 hover:bg-red-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-red-800 dark:hover:bg-red-950/30"
        >
          Informação incorreta
        </button>
        <button
          type="button"
          onClick={openEnrichContent}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
        >
          Enriquecer artigo
        </button>
      </div>
    </section>
  );
}
