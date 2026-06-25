import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const releasesFile = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'releases.json'), 'utf8'),
);

const releases = releasesFile.releases;

if (!Array.isArray(releases) || releases.length === 0) {
  console.error('ERRO: releases.json não contém releases.');
  process.exit(1);
}

const latestRelease = releases[0];

if (packageJson.version !== latestRelease.version) {
  console.error(
    `ERRO: package.json (${packageJson.version}) difere da release mais recente (${latestRelease.version}).`,
  );
  process.exit(1);
}

console.log(`OK: versão ${packageJson.version} consistente entre package.json e releases.json.`);
