import type { ContributionMode, ContributionPayload } from '@/lib/contributions';
import ImageUploadField, {
  inputClass,
  labelClass,
} from '@/components/interactive/contribution/ImageUploadField';

interface Props {
  form: ContributionPayload;
  mode: ContributionMode;
  requireImage: boolean;
  updateArticle: <K extends keyof ContributionPayload['article']>(
    key: K,
    value: ContributionPayload['article'][K],
  ) => void;
  setError: (message: string) => void;
}

export default function ArticleFields({
  form,
  mode,
  requireImage,
  updateArticle,
  setError,
}: Props) {
  const { article } = form;
  const showFullArticle = mode !== 'enrich_content';
  const showEnrichmentFields = mode === 'enrich_content';

  return (
    <fieldset className="space-y-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
      <legend className="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Artigo do feriado
      </legend>

      {showFullArticle && (
        <>
          <div>
            <label htmlFor="lead" className={labelClass}>
              Texto de abertura (lead) *
            </label>
            <textarea
              id="lead"
              required
              rows={3}
              className={inputClass}
              value={article.lead}
              onChange={(event) => updateArticle('lead', event.target.value)}
              placeholder="Parágrafo introdutório sobre o feriado"
            />
          </div>

          <div>
            <label htmlFor="legal-basis" className={labelClass}>
              Base legal
            </label>
            <textarea
              id="legal-basis"
              rows={2}
              className={inputClass}
              value={article.legalBasis ?? ''}
              onChange={(event) => updateArticle('legalBasis', event.target.value)}
              placeholder="Lei, decreto ou fundamento legal"
            />
          </div>

          <div>
            <label htmlFor="history" className={labelClass}>
              História * <span className="font-normal text-neutral-500">(um parágrafo por linha)</span>
            </label>
            <textarea
              id="history"
              required
              rows={4}
              className={inputClass}
              value={article.history}
              onChange={(event) => updateArticle('history', event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="traditions" className={labelClass}>
              Tradições <span className="font-normal text-neutral-500">(um item por linha)</span>
            </label>
            <textarea
              id="traditions"
              rows={3}
              className={inputClass}
              value={article.traditions ?? ''}
              onChange={(event) => updateArticle('traditions', event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="fun-facts" className={labelClass}>
              Curiosidades <span className="font-normal text-neutral-500">(um item por linha)</span>
            </label>
            <textarea
              id="fun-facts"
              rows={3}
              className={inputClass}
              value={article.funFacts ?? ''}
              onChange={(event) => updateArticle('funFacts', event.target.value)}
            />
          </div>
        </>
      )}

      {showEnrichmentFields && (
        <>
          <div>
            <label htmlFor="history" className={labelClass}>
              História <span className="font-normal text-neutral-500">(um parágrafo por linha)</span>
            </label>
            <textarea
              id="history"
              rows={4}
              className={inputClass}
              value={article.history}
              onChange={(event) => updateArticle('history', event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="traditions" className={labelClass}>
              Tradições <span className="font-normal text-neutral-500">(um item por linha)</span>
            </label>
            <textarea
              id="traditions"
              rows={3}
              className={inputClass}
              value={article.traditions ?? ''}
              onChange={(event) => updateArticle('traditions', event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="fun-facts" className={labelClass}>
              Curiosidades <span className="font-normal text-neutral-500">(um item por linha)</span>
            </label>
            <textarea
              id="fun-facts"
              rows={3}
              className={inputClass}
              value={article.funFacts ?? ''}
              onChange={(event) => updateArticle('funFacts', event.target.value)}
            />
          </div>
        </>
      )}

      <ImageUploadField
        article={article}
        requireImage={requireImage}
        updateArticle={updateArticle}
        setError={setError}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="source-label" className={labelClass}>
            Nome da fonte oficial *
          </label>
          <input
            id="source-label"
            type="text"
            required
            className={inputClass}
            value={article.sourceLabel}
            onChange={(event) => updateArticle('sourceLabel', event.target.value)}
            placeholder="Prefeitura, Planalto, etc."
          />
        </div>
        <div>
          <label htmlFor="source-url" className={labelClass}>
            Link da fonte *
          </label>
          <input
            id="source-url"
            type="url"
            required
            className={inputClass}
            value={article.sourceUrl}
            onChange={(event) => updateArticle('sourceUrl', event.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    </fieldset>
  );
}
