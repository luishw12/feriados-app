import releasesFile from '@/data/releases.json';
import type { Release, ReleaseSectionKey } from '@/data/schema';
import { getAppVersion } from '@/lib/version';

const SECTION_LABELS: Record<ReleaseSectionKey, string> = {
  added: 'Adicionado',
  changed: 'Alterado',
  deprecated: 'Descontinuado',
  removed: 'Removido',
  fixed: 'Corrigido',
  security: 'Segurança',
};

export const RELEASE_SECTION_ORDER: ReleaseSectionKey[] = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
];

export function getReleases(): Release[] {
  return releasesFile.releases;
}

export function getLatestRelease(): Release | undefined {
  return getReleases()[0];
}

export function getReleaseSectionLabel(key: ReleaseSectionKey): string {
  return SECTION_LABELS[key];
}

export function formatReleaseDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getReleaseStatusLabel(status: Release['status']): string {
  switch (status) {
    case 'beta':
      return 'Beta';
    case 'rc':
      return 'Release candidate';
    case 'stable':
      return 'Estável';
  }
}

export function assertVersionMatchesLatestRelease(): void {
  const latest = getLatestRelease();
  const appVersion = getAppVersion();

  if (!latest || latest.version !== appVersion) {
    throw new Error(
      `Versão do app (${appVersion}) não corresponde à release mais recente (${latest?.version ?? 'nenhuma'}).`,
    );
  }
}
