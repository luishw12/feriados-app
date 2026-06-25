import type { ImageMetadata } from 'astro';

const holidayImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/holidays/*.{svg,jpg,jpeg,png,webp}',
  { eager: true },
);

export function isExternalImageSrc(src: string): boolean {
  return src.startsWith('https://') || src.startsWith('http://');
}

export function getHolidayImageSrc(filename: string): ImageMetadata | undefined {
  const key = `/src/assets/holidays/${filename}`;
  return holidayImages[key]?.default;
}

export function getDefaultHolidayImage(): ImageMetadata {
  const fallback = getHolidayImageSrc('_default.svg');
  if (!fallback) {
    throw new Error('Imagem padrão de feriado não encontrada em src/assets/holidays/_default.svg');
  }
  return fallback;
}

export function resolveHolidayArticleImage(filename?: string): ImageMetadata {
  if (filename && !isExternalImageSrc(filename)) {
    const image = getHolidayImageSrc(filename);
    if (image) return image;
  }
  return getDefaultHolidayImage();
}

export function getHolidayArticleOgImage(imageSrc?: string): string {
  if (imageSrc && isExternalImageSrc(imageSrc)) {
    return imageSrc;
  }
  return '/og/default.png';
}
