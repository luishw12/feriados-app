export type DataScope = 'national' | 'state' | 'municipal';

export function resolveHolidayDataPath(
  scope: DataScope,
  uf?: string,
  citySlug?: string,
): string {
  if (scope === 'national') {
    return 'src/data/holidays/national.json';
  }

  const normalizedUf = uf?.trim().toUpperCase();
  if (!normalizedUf) {
    throw new Error('UF é obrigatória para feriados estaduais e municipais.');
  }

  if (scope === 'state') {
    return `src/data/holidays/states/${normalizedUf}.json`;
  }

  const slug = citySlug?.trim();
  if (!slug) {
    throw new Error('Slug da cidade é obrigatório para feriados municipais.');
  }

  return `src/data/holidays/municipalities/${normalizedUf}/${slug}.json`;
}

export function resolveArticlePath(holidayId: string): string {
  return `src/data/articles/${holidayId}.json`;
}

export function resolveHolidayImagePath(holidayId: string, extension: string): string {
  return `src/assets/holidays/${holidayId}.${extension}`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extensionFromMimeType(mimeType: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? null;
}
