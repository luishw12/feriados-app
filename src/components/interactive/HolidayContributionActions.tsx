import { Pencil } from 'lucide-react';
import type {
  ContributionArticleContext,
  ContributionHolidayContext,
  ContributionMode,
} from '@/lib/contributions';
import { openContributionModal } from '@/lib/contributions';

interface Props {
  holidayId: string;
  holidayName: string;
  pageUrl: string;
  holiday: ContributionHolidayContext;
  article?: ContributionArticleContext;
  variant?: 'default' | 'hero' | 'inline';
}

function openModal(
  mode: ContributionMode,
  holidayId: string,
  holidayName: string,
  pageUrl: string,
  holiday: ContributionHolidayContext,
  article?: ContributionArticleContext,
) {
  openContributionModal({
    mode,
    holidayId,
    holidayName,
    pageUrl,
    holiday,
    article,
  });
}

export default function HolidayContributionActions({
  holidayId,
  holidayName,
  pageUrl,
  holiday,
  article,
  variant = 'default',
}: Props) {
  const hasArticle = Boolean(article);

  if (variant === 'hero') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            openModal('report_error', holidayId, holidayName, pageUrl, holiday, article)
          }
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Corrigir feriado
        </button>
        {hasArticle && (
          <button
            type="button"
            onClick={() =>
              openModal('enrich_content', holidayId, holidayName, pageUrl, holiday, article)
            }
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            Enriquecer conteúdo
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={() =>
          openModal(
            hasArticle ? 'report_error' : 'suggest_holiday',
            holidayId,
            holidayName,
            pageUrl,
            holiday,
            article,
          )
        }
        className={[
          'absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg',
          'border border-neutral-200/80 bg-white/95 text-neutral-500 shadow-sm',
          'max-md:opacity-100 opacity-0 transition-all duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
          'focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600',
          'dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-400',
          'dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400',
        ].join(' ')}
        aria-label={`Corrigir ${holidayName}`}
        title="Corrigir feriado"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          openModal('report_error', holidayId, holidayName, pageUrl, holiday, article)
        }
        className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        Corrigir feriado
      </button>
      <button
        type="button"
        onClick={() =>
          openModal('enrich_content', holidayId, holidayName, pageUrl, holiday, article)
        }
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        Enriquecer conteúdo
      </button>
    </div>
  );
}
