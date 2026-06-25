import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const releasesPath = join(root, 'src', 'data', 'releases.json');
const changelogPath = join(root, 'CHANGELOG.md');

/** @typedef {{ version: string; date: string; status: string; summary: string; sections: Record<string, string[]> }} Release */

const SECTION_LABELS = {
  added: 'Adicionado',
  changed: 'Alterado',
  deprecated: 'Descontinuado',
  removed: 'Removido',
  fixed: 'Corrigido',
  security: 'Segurança',
};

const SECTION_ORDER = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
];

/** @param {Release} release */
function formatRelease(release) {
  const lines = [`## [${release.version}] - ${release.date}`, '', release.summary, ''];

  for (const key of SECTION_ORDER) {
    const items = release.sections[key] ?? [];
    if (items.length === 0) continue;

    lines.push(`### ${SECTION_LABELS[key]}`);
    lines.push('');
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function buildChangelog(releases) {
  const header = [
    '# Changelog',
    '',
    'Todas as mudanças notáveis deste projeto são documentadas neste arquivo.',
    '',
    'O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)',
    'e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).',
    '',
    '> **Não edite este arquivo manualmente.** Ele é gerado a partir de',
    '> `src/data/releases.json` via `npm run changelog:sync`.',
    '',
  ].join('\n');

  const body = releases.map(formatRelease).join('\n\n');
  return `${header}\n${body}\n`;
}

const raw = readFileSync(releasesPath, 'utf8');
const { releases } = JSON.parse(raw);

if (!Array.isArray(releases) || releases.length === 0) {
  console.error('releases.json deve conter ao menos uma release em "releases".');
  process.exit(1);
}

const content = buildChangelog(releases);
writeFileSync(changelogPath, content, 'utf8');
console.log(`CHANGELOG.md gerado com ${releases.length} release(s).`);
