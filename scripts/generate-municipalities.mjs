import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const municipalitiesDir = join(root, 'src/data/holidays/municipalities');
const indexPath = join(root, 'public/data/municipalities-index.json');

const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const FERIADOS_URL =
  'https://raw.githubusercontent.com/joaopbini/feriados-brasil/master/dados/feriados/municipal/json/2026.json';

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseBrazilianDate(dateStr) {
  const match = /^(\d{2})\/(\d{2})\/\d{4}$/.exec(dateStr);
  if (!match) return null;
  return `${match[2]}-${match[1]}`;
}

function buildAutoHoliday(cityName, citySlug, mmdd, index) {
  const suffix = index === 0 ? 'aniversario' : `feriado-${mmdd.replace('-', '')}`;
  const id = index === 0 ? `aniversario-${citySlug}` : `feriado-municipal-${citySlug}-${mmdd.replace('-', '')}`;
  const name =
    index === 0 ? `Aniversário de ${cityName}` : `Feriado Municipal de ${cityName}`;
  return {
    id,
    name,
    date: mmdd,
    type: 'municipal',
    description:
      index === 0
        ? 'Feriado municipal — aniversário da cidade.'
        : 'Feriado municipal local.',
    categories: ['historico', 'civico'],
  };
}

function loadExistingFiles() {
  /** @type {Map<string, object>} */
  const map = new Map();
  if (!existsSync(municipalitiesDir)) return map;

  for (const uf of readdirSync(municipalitiesDir)) {
    const ufDir = join(municipalitiesDir, uf);
    for (const file of readdirSync(ufDir)) {
      if (!file.endsWith('.json')) continue;
      const content = JSON.parse(readFileSync(join(ufDir, file), 'utf8'));
      map.set(`${content.uf}/${content.slug}`, content);
    }
  }
  return map;
}

function mergeHolidays(autoHolidays, existingHolidays) {
  const autoIds = new Set(autoHolidays.map((h) => h.id));
  const autoDates = new Set(autoHolidays.map((h) => h.date));
  const preserved = (existingHolidays ?? []).filter(
    (h) => !autoIds.has(h.id) && !autoDates.has(h.date),
  );
  return [...autoHolidays, ...preserved].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function main() {
  console.log('Fetching IBGE municipalities...');
  const ibgeMunicipalities = await fetchJson(IBGE_URL);

  console.log('Fetching municipal holidays (feriados-brasil 2026)...');
  const feriadosRaw = await fetchJson(FERIADOS_URL);

  /** @type {Map<number, string[]>} */
  const holidaysByIbge = new Map();
  for (const entry of feriadosRaw) {
    const ibge = entry.codigo_ibge;
    const mmdd = parseBrazilianDate(entry.data);
    if (!ibge || !mmdd) continue;
    const dates = holidaysByIbge.get(ibge) ?? [];
    if (!dates.includes(mmdd)) dates.push(mmdd);
    holidaysByIbge.set(ibge, dates);
  }

  const existingFiles = loadExistingFiles();
  const index = [];
  let withHolidays = 0;
  let preservedExtras = 0;

  if (existsSync(municipalitiesDir)) {
    rmSync(municipalitiesDir, { recursive: true, force: true });
  }

  for (const municipality of ibgeMunicipalities) {
    const ibgeCode = municipality.id;
    const name = municipality.nome;
    const uf =
      municipality.microrregiao?.mesorregiao?.UF?.sigla ??
      municipality['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla;
    if (!uf) continue;

    const slug = slugify(name);
    const key = `${uf}/${slug}`;
    const existing = existingFiles.get(key);

    const dates = (holidaysByIbge.get(ibgeCode) ?? []).sort();
    const autoHolidays = dates.map((mmdd, i) => buildAutoHoliday(name, slug, mmdd, i));
    const holidays = mergeHolidays(autoHolidays, existing?.holidays);
    if (holidays.length > 0) withHolidays += 1;
    if (existing?.holidays?.length > autoHolidays.length) preservedExtras += 1;

    const file = {
      ibgeCode,
      name,
      slug,
      uf,
      holidays,
    };

    const ufDir = join(municipalitiesDir, uf);
    mkdirSync(ufDir, { recursive: true });
    writeFileSync(join(ufDir, `${slug}.json`), `${JSON.stringify(file, null, 2)}\n`, 'utf8');

    const indexEntry = { slug, name, uf };
    if (holidays.length > 0) {
      indexEntry.holidayDates = holidays.map((holiday) => holiday.date);
      const primary = holidays.find((h) => h.id.startsWith('aniversario-')) ?? holidays[0];
      if (primary?.date) {
        indexEntry.anniversary = primary.date;
      }
    }
    index.push(indexEntry);
  }

  index.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, 'pt-BR');
    if (byName !== 0) return byName;
    return a.uf.localeCompare(b.uf, 'pt-BR');
  });

  mkdirSync(dirname(indexPath), { recursive: true });
  writeFileSync(indexPath, `${JSON.stringify(index)}\n`, 'utf8');

  console.log(`Generated ${index.length} municipalities`);
  console.log(`${withHolidays} with at least one municipal holiday`);
  console.log(`${preservedExtras} with preserved manual extras`);
  console.log(`Index written to ${indexPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
