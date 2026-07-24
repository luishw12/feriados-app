import type { ContributionMode, ContributionPayload } from '@/lib/contributions';
import {
  DATE_RULE_OPTIONS,
  HOLIDAY_CATEGORIES,
  HOLIDAY_SCOPES,
  HOLIDAY_TYPES,
} from '@/lib/contributions';
import { inputClass, labelClass } from '@/components/interactive/contribution/ImageUploadField';

interface Props {
  form: ContributionPayload;
  mode: ContributionMode;
  updateHoliday: <K extends keyof ContributionPayload['holiday']>(
    key: K,
    value: ContributionPayload['holiday'][K],
  ) => void;
}

export default function HolidayFields({ form, mode, updateHoliday }: Props) {
  const { holiday } = form;
  const showHolidayFields = mode !== 'enrich_content';

  if (!showHolidayFields) return null;

  return (
    <fieldset className="space-y-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
      <legend className="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Dados do feriado
      </legend>

      <div>
        <label htmlFor="holiday-name" className={labelClass}>
          Nome do feriado *
        </label>
        <input
          id="holiday-name"
          type="text"
          required
          className={inputClass}
          value={holiday.name}
          onChange={(event) => updateHoliday('name', event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="scope" className={labelClass}>
          Escopo *
        </label>
        <select
          id="scope"
          required
          className={inputClass}
          value={holiday.scope}
          onChange={(event) =>
            updateHoliday('scope', event.target.value as ContributionPayload['holiday']['scope'])
          }
        >
          {HOLIDAY_SCOPES.map((scope) => (
            <option key={scope.value} value={scope.value}>
              {scope.label}
            </option>
          ))}
        </select>
      </div>

      {holiday.scope !== 'national' && (
        <div>
          <label htmlFor="state" className={labelClass}>
            Estado (UF) *
          </label>
          <input
            id="state"
            type="text"
            required
            maxLength={2}
            className={inputClass}
            value={holiday.state ?? ''}
            onChange={(event) => updateHoliday('state', event.target.value.toUpperCase())}
            placeholder="RS"
          />
        </div>
      )}

      {holiday.scope === 'municipal' && (
        <>
          <div>
            <label htmlFor="city" className={labelClass}>
              Cidade *
            </label>
            <input
              id="city"
              type="text"
              required
              className={inputClass}
              value={holiday.city ?? ''}
              onChange={(event) => updateHoliday('city', event.target.value)}
              placeholder="Porto Alegre"
            />
          </div>
          <div>
            <label htmlFor="city-slug" className={labelClass}>
              Slug da cidade {mode === 'suggest_holiday' ? '*' : ''}
            </label>
            <input
              id="city-slug"
              type="text"
              required={mode === 'suggest_holiday'}
              className={inputClass}
              value={holiday.citySlug ?? ''}
              onChange={(event) => updateHoliday('citySlug', event.target.value)}
              placeholder="porto-alegre"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              kebab-case, sem acentos (ex.: sao-paulo).
            </p>
          </div>
        </>
      )}

      <div>
        <label htmlFor="holiday-type" className={labelClass}>
          Tipo *
        </label>
        <select
          id="holiday-type"
          required
          className={inputClass}
          value={holiday.type}
          onChange={(event) =>
            updateHoliday('type', event.target.value as ContributionPayload['holiday']['type'])
          }
        >
          {HOLIDAY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Data *</span>
        <div className="mb-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="radio"
              name="date-kind"
              checked={holiday.dateKind === 'fixed'}
              onChange={() => updateHoliday('dateKind', 'fixed')}
            />
            Fixa (MM-DD)
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="radio"
              name="date-kind"
              checked={holiday.dateKind === 'mobile'}
              onChange={() => updateHoliday('dateKind', 'mobile')}
            />
            Móvel (Páscoa)
          </label>
        </div>

        {holiday.dateKind === 'fixed' ? (
          <input
            id="date"
            type="text"
            required
            className={inputClass}
            value={holiday.date ?? ''}
            onChange={(event) => updateHoliday('date', event.target.value)}
            placeholder="09-20"
          />
        ) : (
          <select
            id="date-rule"
            required
            className={inputClass}
            value={holiday.dateRule ?? ''}
            onChange={(event) => updateHoliday('dateRule', event.target.value)}
          >
            <option value="">Selecione a regra…</option>
            {DATE_RULE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <span className={labelClass}>Categorias *</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {HOLIDAY_CATEGORIES.map((category) => {
            const checked = holiday.categories.includes(category.value);
            return (
              <label
                key={category.value}
                className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...holiday.categories, category.value]
                      : holiday.categories.filter((item) => item !== category.value);
                    updateHoliday('categories', next);
                  }}
                />
                {category.label}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição curta
        </label>
        <textarea
          id="description"
          rows={2}
          className={inputClass}
          value={holiday.description ?? ''}
          onChange={(event) => updateHoliday('description', event.target.value)}
          placeholder="Breve descrição do feriado"
        />
      </div>
    </fieldset>
  );
}
