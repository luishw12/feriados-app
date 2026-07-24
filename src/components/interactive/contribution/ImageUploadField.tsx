import type { ChangeEvent } from 'react';
import type { ContributionArticlePayload, ContributionPayload } from '@/lib/contributions';
import { MAX_IMAGE_BYTES } from '@/lib/contributions';

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder:text-neutral-500';

const labelClass = 'mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

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
    <fieldset className="space-y-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
      <legend className="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Imagem de banner {requireImage ? '*' : '(opcional)'}
      </legend>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="radio"
            name="image-source"
            checked={article.imageSource === 'upload'}
            onChange={() => {
              updateArticle('imageSource', 'upload');
              updateArticle('imageUrl', '');
            }}
          />
          Enviar arquivo
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="radio"
            name="image-source"
            checked={article.imageSource === 'url'}
            onChange={() => {
              updateArticle('imageSource', 'url');
              updateArticle('imageData', undefined);
              updateArticle('imageMimeType', undefined);
              updateArticle('imageFileName', undefined);
            }}
          />
          URL externa
        </label>
      </div>

      {article.imageSource === 'upload' ? (
        <div>
          <label htmlFor="banner-image" className={labelClass}>
            Arquivo da imagem {requireImage ? '*' : ''}
          </label>
          <input
            id="banner-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={requireImage}
            className={inputClass}
            onChange={handleFileChange}
          />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            JPG, PNG ou WebP. Máximo 2 MB. Será salvo em `src/assets/holidays/`.
          </p>
          {article.imageFileName && (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Selecionado: {article.imageFileName}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="banner-image-url" className={labelClass}>
            URL da imagem {requireImage ? '*' : ''}
          </label>
          <input
            id="banner-image-url"
            type="url"
            required={requireImage}
            className={inputClass}
            value={article.imageUrl ?? ''}
            onChange={(event) => updateArticle('imageUrl', event.target.value)}
            placeholder="https://upload.wikimedia.org/..."
          />
        </div>
      )}

      <div>
        <label htmlFor="image-alt" className={labelClass}>
          Texto alternativo da imagem *
        </label>
        <input
          id="image-alt"
          type="text"
          required
          className={inputClass}
          value={article.imageAlt}
          onChange={(event) => updateArticle('imageAlt', event.target.value)}
          placeholder="Descrição da imagem para leitores de tela"
        />
      </div>

      <div>
        <label htmlFor="image-credit" className={labelClass}>
          Crédito da imagem
        </label>
        <input
          id="image-credit"
          type="text"
          className={inputClass}
          value={article.imageCredit ?? ''}
          onChange={(event) => updateArticle('imageCredit', event.target.value)}
          placeholder="Ex.: Wikimedia Commons — Autor"
        />
      </div>
    </fieldset>
  );
}

export { inputClass, labelClass };
