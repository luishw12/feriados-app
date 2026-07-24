import type { ContributionPayload, SocialPlatform } from '@/lib/contributions';
import { SOCIAL_PLATFORMS } from '@/lib/contributions';
import { inputClass, labelClass } from '@/components/interactive/contribution/ImageUploadField';

interface Props {
  form: ContributionPayload;
  updateField: <K extends keyof ContributionPayload>(key: K, value: ContributionPayload[K]) => void;
}

export default function ContributorFields({ form, updateField }: Props) {
  return (
    <>
      <div>
        <label htmlFor="source" className={labelClass}>
          Fonte oficial / referência legal da alteração *
        </label>
        <textarea
          id="source"
          required
          rows={2}
          className={inputClass}
          value={form.source}
          onChange={(event) => updateField('source', event.target.value)}
          placeholder="Lei, decreto, site do governo ou outra fonte confiável"
        />
      </div>

      {form.type !== 'suggest_holiday' && (
        <div>
          <label htmlFor="change-notes" className={labelClass}>
            {form.type === 'report_error' ? 'O que foi corrigido? *' : 'Informação adicional *'}
          </label>
          <textarea
            id="change-notes"
            required
            rows={3}
            className={inputClass}
            value={form.changeNotes ?? ''}
            onChange={(event) => updateField('changeNotes', event.target.value)}
            placeholder={
              form.type === 'report_error'
                ? 'Descreva as correções feitas nos campos acima'
                : 'Descreva o que você acrescentou ou alterou'
            }
          />
        </div>
      )}

      <fieldset className="space-y-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
        <legend className="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Crédito público (opcional)
        </legend>
        <div>
          <label htmlFor="contributor-name" className={labelClass}>
            Seu nome
          </label>
          <input
            id="contributor-name"
            type="text"
            className={inputClass}
            value={form.contributorName ?? ''}
            onChange={(event) => updateField('contributorName', event.target.value)}
            placeholder="Como deseja ser creditado"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="social-platform" className={labelClass}>
              Rede social
            </label>
            <select
              id="social-platform"
              className={inputClass}
              value={form.contributorSocialPlatform ?? ''}
              onChange={(event) =>
                updateField(
                  'contributorSocialPlatform',
                  event.target.value ? (event.target.value as SocialPlatform) : undefined,
                )
              }
            >
              <option value="">Selecione…</option>
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="social-url" className={labelClass}>
              Link do perfil
            </label>
            <input
              id="social-url"
              type="url"
              className={inputClass}
              value={form.contributorSocialUrl ?? ''}
              onChange={(event) => updateField('contributorSocialUrl', event.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
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
      </fieldset>
    </>
  );
}
