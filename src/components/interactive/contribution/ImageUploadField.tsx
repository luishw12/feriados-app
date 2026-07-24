import type { ChangeEvent } from 'react';
import type { ContributionArticlePayload } from '@/lib/contributions';
import { MAX_IMAGE_BYTES } from '@/lib/contributions';
import Field from '@/components/interactive/contribution/Field';
import FormSection from '@/components/interactive/contribution/FormSection';
import { controlClassName } from '@/components/interactive/contribution/formStyles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface Props {
  article: ContributionArticlePayload;
  requireImage: boolean;
  updateArticle: <K extends keyof ContributionArticlePayload>(
    key: K,
    value: ContributionArticlePayload[K],
  ) => void;
  setError: (message: string) => void;
}

export default function ImageUploadField({ article, requireImage, updateArticle, setError }: Props) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG ou WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('A imagem deve ter no máximo 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? (result.split(',')[1] ?? '') : result;
      updateArticle('imageData', base64);
      updateArticle('imageMimeType', file.type);
      updateArticle('imageFileName', file.name);
      updateArticle('imageSource', 'upload');
      setError('');
    };
    reader.onerror = () => {
      setError('Não foi possível ler a imagem enviada.');
    };
    reader.readAsDataURL(file);
  }

  return (
    <FormSection
      bare
      description={
        requireImage
          ? 'Banner obrigatório da página do feriado. Prefira boa resolução e crédito claro.'
          : 'Banner opcional da página do feriado. Prefira boa resolução e crédito claro.'
      }
    >
      <div className="sm:col-span-2 lg:col-span-12">
        <Label className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Origem da imagem
        </Label>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={article.imageSource}
          onValueChange={(value) => {
            if (value === 'upload') {
              updateArticle('imageSource', 'upload');
              updateArticle('imageUrl', '');
              return;
            }
            if (value === 'url') {
              updateArticle('imageSource', 'url');
              updateArticle('imageData', undefined);
              updateArticle('imageMimeType', undefined);
              updateArticle('imageFileName', undefined);
            }
          }}
          className="w-full max-w-md"
        >
          <ToggleGroupItem value="upload" className="flex-1">
            Enviar arquivo
          </ToggleGroupItem>
          <ToggleGroupItem value="url" className="flex-1">
            URL externa
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {article.imageSource === 'upload' ? (
        <Field
          label="Arquivo da imagem"
          htmlFor="banner-image"
          required={requireImage}
          hint="JPG, PNG ou WebP. Máximo 2 MB. Será salvo em src/assets/holidays/."
          className="sm:col-span-2 lg:col-span-12"
        >
          <Input
            id="banner-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={requireImage}
            className={cn(
              controlClassName('h-9'),
              'file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary',
            )}
            onChange={handleFileChange}
          />
          {article.imageFileName && (
            <p className="mt-1.5 text-xs text-primary">Selecionado: {article.imageFileName}</p>
          )}
        </Field>
      ) : (
        <Field
          label="URL da imagem"
          htmlFor="banner-image-url"
          required={requireImage}
          className="sm:col-span-2 lg:col-span-12"
        >
          <Input
            id="banner-image-url"
            type="url"
            required={requireImage}
            className={controlClassName('h-9')}
            value={article.imageUrl ?? ''}
            onChange={(event) => updateArticle('imageUrl', event.target.value)}
            placeholder="https://upload.wikimedia.org/..."
          />
        </Field>
      )}

      <Field label="Texto alternativo" htmlFor="image-alt" required className="lg:col-span-7">
        <Input
          id="image-alt"
          type="text"
          required
          className={controlClassName('h-9')}
          value={article.imageAlt}
          onChange={(event) => updateArticle('imageAlt', event.target.value)}
          placeholder="Descrição da imagem para leitores de tela"
        />
      </Field>

      <Field label="Crédito da imagem" htmlFor="image-credit" className="lg:col-span-5">
        <Input
          id="image-credit"
          type="text"
          className={controlClassName('h-9')}
          value={article.imageCredit ?? ''}
          onChange={(event) => updateArticle('imageCredit', event.target.value)}
          placeholder="Ex.: Wikimedia Commons — Autor"
        />
      </Field>
    </FormSection>
  );
}
