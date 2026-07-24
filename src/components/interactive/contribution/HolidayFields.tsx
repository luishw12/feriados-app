import type { ContributionMode, ContributionPayload } from '@/lib/contributions';
import {
  DATE_RULE_OPTIONS,
  HOLIDAY_CATEGORIES,
  HOLIDAY_SCOPES,
  HOLIDAY_TYPES,
} from '@/lib/contributions';
import Field from '@/components/interactive/contribution/Field';
import FormSection from '@/components/interactive/contribution/FormSection';
import FormSelect from '@/components/interactive/contribution/FormSelect';
import { controlClassName } from '@/components/interactive/contribution/formStyles';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

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
  if (mode === 'enrich_content') return null;

  const isMunicipal = holiday.scope === 'municipal';
  const hasState = holiday.scope !== 'national';

  return (
    <FormSection bare description="Informações básicas usadas no calendário e nas páginas do site.">
      <Field label="Nome do feriado" htmlFor="holiday-name" required className="sm:col-span-2 lg:col-span-12">
        <Input
          id="holiday-name"
          type="text"
          required
          className={controlClassName('h-9')}
          value={holiday.name}
          onChange={(event) => updateHoliday('name', event.target.value)}
          placeholder="Ex.: Dia do Município"
        />
      </Field>

      <Field
        label="Escopo"
        htmlFor="scope"
        required
        className={hasState ? 'lg:col-span-4' : 'lg:col-span-6'}
      >
        <FormSelect
          id="scope"
          required
          value={holiday.scope}
          onValueChange={(value) =>
            updateHoliday('scope', value as ContributionPayload['holiday']['scope'])
          }
          options={HOLIDAY_SCOPES.map((scope) => ({ value: scope.value, label: scope.label }))}
        />
      </Field>

      <Field
        label="Tipo"
        htmlFor="holiday-type"
        required
        className={hasState ? 'lg:col-span-4' : 'lg:col-span-6'}
      >
        <FormSelect
          id="holiday-type"
          required
          value={holiday.type}
          onValueChange={(value) =>
            updateHoliday('type', value as ContributionPayload['holiday']['type'])
          }
          options={HOLIDAY_TYPES.map((type) => ({ value: type.value, label: type.label }))}
        />
      </Field>

      {hasState && (
        <Field label="Estado (UF)" htmlFor="state" required className="lg:col-span-4">
          <Input
            id="state"
            type="text"
            required
            maxLength={2}
            className={controlClassName('h-9 uppercase')}
            value={holiday.state ?? ''}
            onChange={(event) => updateHoliday('state', event.target.value.toUpperCase())}
            placeholder="RS"
          />
        </Field>
      )}

      {isMunicipal && (
        <>
          <Field label="Cidade" htmlFor="city" required className="lg:col-span-6">
            <Input
              id="city"
              type="text"
              required
              className={controlClassName('h-9')}
              value={holiday.city ?? ''}
              onChange={(event) => updateHoliday('city', event.target.value)}
              placeholder="Porto Alegre"
            />
          </Field>
          <Field
            label="Slug da cidade"
            htmlFor="city-slug"
            required={mode === 'suggest_holiday'}
            hint="kebab-case, sem acentos (ex.: sao-paulo)"
            className="lg:col-span-6"
          >
            <Input
              id="city-slug"
              type="text"
              required={mode === 'suggest_holiday'}
              className={controlClassName('h-9')}
              value={holiday.citySlug ?? ''}
              onChange={(event) => updateHoliday('citySlug', event.target.value)}
              placeholder="porto-alegre"
            />
          </Field>
        </>
      )}

      <div className="sm:col-span-2 lg:col-span-5">
        <Label className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tipo de data *
        </Label>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={holiday.dateKind}
          onValueChange={(value) => {
            if (value === 'fixed' || value === 'mobile') {
              updateHoliday('dateKind', value);
            }
          }}
          className="w-full"
        >
          <ToggleGroupItem value="fixed" className="flex-1">
            Fixa (MM-DD)
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" className="flex-1">
            Móvel (Páscoa)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Field
        label={holiday.dateKind === 'fixed' ? 'Data' : 'Regra da data'}
        htmlFor={holiday.dateKind === 'fixed' ? 'date' : 'date-rule'}
        required
        className="lg:col-span-7"
      >
        {holiday.dateKind === 'fixed' ? (
          <Input
            id="date"
            type="text"
            required
            className={controlClassName('h-9')}
            value={holiday.date ?? ''}
            onChange={(event) => updateHoliday('date', event.target.value)}
            placeholder="09-20"
          />
        ) : (
          <FormSelect
            id="date-rule"
            required
            value={holiday.dateRule ?? ''}
            onValueChange={(value) => updateHoliday('dateRule', value)}
            placeholder="Selecione a regra…"
            options={DATE_RULE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        )}
      </Field>

      <div className="sm:col-span-2 lg:col-span-12">
        <Label className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Categorias *
        </Label>
        <input
          type="text"
          required
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute size-0 opacity-0"
          value={holiday.categories.join(',')}
          readOnly
        />
        <div className="flex flex-wrap gap-2">
          {HOLIDAY_CATEGORIES.map((category) => {
            const checked = holiday.categories.includes(category.value);
            const checkboxId = `category-${category.value}`;
            return (
              <label
                key={category.value}
                htmlFor={checkboxId}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  checked
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
                )}
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={(next) => {
                    const isChecked = next === true;
                    const categories = isChecked
                      ? [...holiday.categories, category.value]
                      : holiday.categories.filter((item) => item !== category.value);
                    updateHoliday('categories', categories);
                  }}
                />
                {category.label}
              </label>
            );
          })}
        </div>
      </div>

      <Field label="Descrição curta" htmlFor="description" className="sm:col-span-2 lg:col-span-12">
        <Textarea
          id="description"
          rows={2}
          className={controlClassName('min-h-[72px] resize-y')}
          value={holiday.description ?? ''}
          onChange={(event) => updateHoliday('description', event.target.value)}
          placeholder="Breve descrição do feriado"
        />
      </Field>
    </FormSection>
  );
}
