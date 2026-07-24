import type { ContributionMode, ContributionPayload } from '@/lib/contributions';
import Field from '@/components/interactive/contribution/Field';
import FormSection from '@/components/interactive/contribution/FormSection';
import { controlClassName } from '@/components/interactive/contribution/formStyles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  form: ContributionPayload;
  mode: ContributionMode;
  updateArticle: <K extends keyof ContributionPayload['article']>(
    key: K,
    value: ContributionPayload['article'][K],
  ) => void;
}

export default function ArticleFields({ form, mode, updateArticle }: Props) {
  const { article } = form;
  const showFullArticle = mode !== 'enrich_content';
  const showEnrichmentFields = mode === 'enrich_content';

  return (
    <FormSection bare description="Conteúdo editorial exibido na página pública do feriado.">
      {showFullArticle && (
        <>
          <Field
            label="Texto de abertura (lead)"
            htmlFor="lead"
            required
            className="sm:col-span-2 lg:col-span-12"
          >
            <Textarea
              id="lead"
              required
              rows={3}
              className={controlClassName('min-h-[96px] resize-y')}
              value={article.lead}
              onChange={(event) => updateArticle('lead', event.target.value)}
              placeholder="Parágrafo introdutório sobre o feriado"
            />
          </Field>

          <Field label="Base legal" htmlFor="legal-basis" className="sm:col-span-2 lg:col-span-12">
            <Textarea
              id="legal-basis"
              rows={2}
              className={controlClassName('min-h-[72px] resize-y')}
              value={article.legalBasis ?? ''}
              onChange={(event) => updateArticle('legalBasis', event.target.value)}
              placeholder="Lei, decreto ou fundamento legal"
            />
          </Field>

          <Field
            label="História"
            htmlFor="history"
            required
            hint="Um parágrafo por linha"
            className="lg:col-span-6"
          >
            <Textarea
              id="history"
              required
              rows={5}
              className={controlClassName('min-h-[120px] resize-y')}
              value={article.history}
              onChange={(event) => updateArticle('history', event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-6 lg:grid-cols-1">
            <Field label="Tradições" htmlFor="traditions" hint="Um item por linha">
              <Textarea
                id="traditions"
                rows={2}
                className={controlClassName('min-h-[72px] resize-y')}
                value={article.traditions ?? ''}
                onChange={(event) => updateArticle('traditions', event.target.value)}
              />
            </Field>
            <Field label="Curiosidades" htmlFor="fun-facts" hint="Um item por linha">
              <Textarea
                id="fun-facts"
                rows={2}
                className={controlClassName('min-h-[72px] resize-y')}
                value={article.funFacts ?? ''}
                onChange={(event) => updateArticle('funFacts', event.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {showEnrichmentFields && (
        <>
          <Field
            label="História"
            htmlFor="history"
            hint="Um parágrafo por linha"
            className="lg:col-span-6"
          >
            <Textarea
              id="history"
              rows={5}
              className={controlClassName('min-h-[120px] resize-y')}
              value={article.history}
              onChange={(event) => updateArticle('history', event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-6 lg:grid-cols-1">
            <Field label="Tradições" htmlFor="traditions" hint="Um item por linha">
              <Textarea
                id="traditions"
                rows={2}
                className={controlClassName('min-h-[72px] resize-y')}
                value={article.traditions ?? ''}
                onChange={(event) => updateArticle('traditions', event.target.value)}
              />
            </Field>
            <Field label="Curiosidades" htmlFor="fun-facts" hint="Um item por linha">
              <Textarea
                id="fun-facts"
                rows={2}
                className={controlClassName('min-h-[72px] resize-y')}
                value={article.funFacts ?? ''}
                onChange={(event) => updateArticle('funFacts', event.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      <Field label="Nome da fonte oficial" htmlFor="source-label" required className="lg:col-span-6">
        <Input
          id="source-label"
          type="text"
          required
          className={controlClassName('h-9')}
          value={article.sourceLabel}
          onChange={(event) => updateArticle('sourceLabel', event.target.value)}
          placeholder="Prefeitura, Planalto, etc."
        />
      </Field>
      <Field label="Link da fonte" htmlFor="source-url" required className="lg:col-span-6">
        <Input
          id="source-url"
          type="url"
          required
          className={controlClassName('h-9')}
          value={article.sourceUrl}
          onChange={(event) => updateArticle('sourceUrl', event.target.value)}
          placeholder="https://..."
        />
      </Field>
    </FormSection>
  );
}
