import type { ContributionPayload, SocialPlatform } from '@/lib/contributions';
import { SOCIAL_PLATFORMS } from '@/lib/contributions';
import Field from '@/components/interactive/contribution/Field';
import FormSection from '@/components/interactive/contribution/FormSection';
import FormSelect from '@/components/interactive/contribution/FormSelect';
import { controlClassName } from '@/components/interactive/contribution/formStyles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  form: ContributionPayload;
  updateField: <K extends keyof ContributionPayload>(key: K, value: ContributionPayload[K]) => void;
}

const EMPTY_SOCIAL_VALUE = '__none__';

export default function ContributorFields({ form, updateField }: Props) {
  return (
    <FormSection
      bare
      description="Referência para revisão e crédito público opcional (só aparece se aprovado)."
    >
      <Field
        label="Fonte oficial / referência legal"
        htmlFor="source"
        required
        className="sm:col-span-2 lg:col-span-12"
      >
        <Textarea
          id="source"
          required
          rows={2}
          className={controlClassName('min-h-[72px] resize-y')}
          value={form.source}
          onChange={(event) => updateField('source', event.target.value)}
          placeholder="Lei, decreto, site do governo ou outra fonte confiável"
        />
      </Field>

      {form.type !== 'suggest_holiday' && (
        <Field
          label={form.type === 'report_error' ? 'O que foi corrigido?' : 'Informação adicional'}
          htmlFor="change-notes"
          required
          className="sm:col-span-2 lg:col-span-12"
        >
          <Textarea
            id="change-notes"
            required
            rows={3}
            className={controlClassName('min-h-[96px] resize-y')}
            value={form.changeNotes ?? ''}
            onChange={(event) => updateField('changeNotes', event.target.value)}
            placeholder={
              form.type === 'report_error'
                ? 'Descreva as correções feitas nos campos acima'
                : 'Descreva o que você acrescentou ou alterou'
            }
          />
        </Field>
      )}

      <div className="sm:col-span-2 lg:col-span-12">
        <Label className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Crédito público (opcional)
        </Label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <Field label="Seu nome" htmlFor="contributor-name" className="lg:col-span-4">
            <Input
              id="contributor-name"
              type="text"
              className={controlClassName('h-9')}
              value={form.contributorName ?? ''}
              onChange={(event) => updateField('contributorName', event.target.value)}
              placeholder="Como deseja ser creditado"
            />
          </Field>

          <Field label="Rede social" htmlFor="social-platform" className="lg:col-span-3">
            <FormSelect
              id="social-platform"
              value={form.contributorSocialPlatform ?? EMPTY_SOCIAL_VALUE}
              onValueChange={(value) =>
                updateField(
                  'contributorSocialPlatform',
                  value === EMPTY_SOCIAL_VALUE ? undefined : (value as SocialPlatform),
                )
              }
              options={[
                { value: EMPTY_SOCIAL_VALUE, label: 'Selecione…' },
                ...SOCIAL_PLATFORMS.map((platform) => ({ value: platform, label: platform })),
              ]}
            />
          </Field>

          <Field label="Link do perfil" htmlFor="social-url" className="lg:col-span-5">
            <Input
              id="social-url"
              type="url"
              className={controlClassName('h-9')}
              value={form.contributorSocialUrl ?? ''}
              onChange={(event) => updateField('contributorSocialUrl', event.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </Field>
        </div>
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
        value={form.website ?? ''}
        onChange={(event) => updateField('website', event.target.value)}
        aria-hidden="true"
      />
    </FormSection>
  );
}
