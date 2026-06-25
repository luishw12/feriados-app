import { normalizeText, slugify } from '@/lib/text';

interface MunicipalityRef {
  slug: string;
  name: string;
  uf: string;
}

export function findMunicipalityByName(
  cityName: string,
  uf: string,
  municipalities: MunicipalityRef[],
): MunicipalityRef | undefined {
  const normalized = normalizeText(cityName);
  const slug = slugify(cityName);

  const exactSlug = municipalities.find((m) => m.uf === uf && m.slug === slug);
  if (exactSlug) return exactSlug;

  const exactName = municipalities.find(
    (m) => m.uf === uf && normalizeText(m.name) === normalized,
  );
  if (exactName) return exactName;

  return municipalities.find((m) => {
    if (m.uf !== uf) return false;
    const mName = normalizeText(m.name);
    return mName.includes(normalized) || normalized.includes(mName);
  });
}
