import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const holidaysDir = join(root, 'src/data/holidays');

/** @type {Record<string, string[]>} */
const CATEGORY_MAP = {
  // National
  'confraternizacao-universal': ['civico'],
  'carnaval-segunda': ['cultural'],
  'carnaval-terca': ['cultural'],
  'quarta-cinzas': ['religioso'],
  'sexta-santa': ['religioso'],
  pascoa: ['religioso'],
  tiradentes: ['historico', 'civico'],
  'dia-do-trabalho': ['social'],
  'corpus-christi': ['religioso'],
  independencia: ['historico', 'civico'],
  'nossa-senhora-aparecida': ['religioso'],
  finados: ['religioso'],
  'proclamacao-republica': ['historico', 'civico'],
  'consciencia-negra': ['social'],
  natal: ['religioso', 'cultural'],

  // Commemorative
  'dia-da-mulher': ['social'],
  'dia-da-mentira': ['cultural'],
  'dia-do-indio': ['social', 'cultural'],
  'dia-da-terra': ['social'],
  'dia-das-maes': ['social', 'cultural'],
  'dia-da-familia': ['social'],
  'dia-do-meio-ambiente': ['social'],
  'dia-dos-namorados': ['social', 'cultural'],
  'dia-de-sao-joao': ['cultural', 'religioso'],
  'dia-do-amigo': ['social'],
  'dia-dos-avos': ['social'],
  'dia-do-estudante': ['social'],
  'dia-dos-pais': ['social', 'cultural'],
  'dia-do-folclore': ['cultural'],
  'dia-do-cliente': ['social'],
  'dia-da-arvore': ['social'],
  'dia-do-idoso': ['social'],
  'dia-das-criancas': ['social'],
  'dia-do-professor': ['social'],
  'dia-do-servidor-publico': ['social'],
  'dia-da-bandeira': ['civico'],
  'combate-violencia-mulher': ['social'],

  // State
  'abolicao-ceara': ['historico', 'social'],
  'padroeira-ceara': ['religioso'],
  'adesao-para': ['historico'],
  'criacao-para': ['historico'],
  'padroeira-es': ['religioso'],
  'colonizacao-es': ['historico'],
  'criacao-mt': ['historico'],
  'dia-do-indio-mt': ['social', 'cultural'],
  'inconfidencia-mineira': ['historico'],
  'padroeira-mg': ['religioso'],
  'criacao-ms': ['historico'],
  'dia-do-estadista-ms': ['historico'],
  'revolucao-pernambucana': ['historico'],
  'sao-joao-pe': ['cultural'],
  'dia-do-piaui': ['historico'],
  'sao-sebastiao-rj': ['religioso'],
  'sao-jorge-rj': ['religioso', 'cultural'],
  'criacao-rondonia': ['historico'],
  'dia-do-evangelho-ro': ['religioso'],
  'criacao-roraima': ['historico'],
  'dia-do-indio-rr': ['social', 'cultural'],
  'emancipacao-parana': ['historico'],
  'padroeira-pr': ['religioso'],
  'revolucao-farroupilha': ['historico', 'cultural'],
  'dia-do-gaucho': ['cultural'],
  'criacao-sc': ['historico'],
  'dia-de-santa-catarina': ['religioso'],
  'revolucao-constitucionalista': ['historico'],
  'padroeira-sp': ['religioso'],
  'criacao-tocantins': ['historico'],
  'nossa-senhora-natividade': ['religioso'],
  'aniversario-acre': ['historico', 'civico'],
  'evangelizacao-indigenas-acre': ['historico', 'religioso'],
  'emancipacao-alagoas': ['historico'],
  'sao-joao-alagoas': ['cultural'],
  'criacao-amapa': ['historico'],
  'sao-jose-amapa': ['religioso'],
  'fundacao-paraiba': ['historico'],
  'aniversario-brasilia': ['historico', 'civico'],
  'dia-do-evangelho-df': ['religioso'],
  'independencia-sergipe': ['historico'],
  'eleicao-amazonas': ['historico'],
  'dia-do-amazonense': ['cultural'],
  'morte-lamartine-rn': ['historico'],
  'sao-joao-rn': ['cultural'],
  'independencia-bahia': ['historico'],
  'sao-joao-bahia': ['cultural'],
  'adesao-maranhao': ['historico'],
  'criacao-goias': ['historico'],
  'padroeira-goias': ['religioso'],

  // Municipal (city anniversaries)
  'aniversario-palmas': ['historico', 'civico'],
  'aniversario-campinas': ['historico', 'civico'],
  'aniversario-guarulhos': ['historico', 'civico'],
  'aniversario-sao-paulo': ['historico', 'civico'],
  'aniversario-sao-bernardo-do-campo': ['historico', 'civico'],
  'aniversario-aracaju': ['historico', 'civico'],
  'aniversario-joinville': ['historico', 'civico'],
  'aniversario-lajeado': ['historico', 'civico'],
  'aniversario-florianopolis': ['historico', 'civico'],
  'aniversario-canoas': ['historico', 'civico'],
  'aniversario-santa-maria': ['historico', 'civico'],
  'aniversario-pelotas': ['historico', 'civico'],
  'aniversario-porto-velho': ['historico', 'civico'],
  'aniversario-boa-vista': ['historico', 'civico'],
  'aniversario-caxias-do-sul': ['historico', 'civico'],
  'aniversario-natal': ['historico', 'civico'],
  'aniversario-porto-alegre': ['historico', 'civico'],
  'aniversario-teresina': ['historico', 'civico'],
  'aniversario-jaboatao-dos-guararapes': ['historico', 'civico'],
  'aniversario-recife': ['historico', 'civico'],
  'aniversario-londrina': ['historico', 'civico'],
  'aniversario-curitiba': ['historico', 'civico'],
  'aniversario-rio-de-janeiro': ['historico', 'civico'],
  'aniversario-sao-goncalo': ['historico', 'civico'],
  'aniversario-belem': ['historico', 'civico'],
  'aniversario-joao-pessoa': ['historico', 'civico'],
  'aniversario-campo-grande': ['historico', 'civico'],
  'aniversario-belo-horizonte': ['historico', 'civico'],
  'aniversario-cuiaba': ['historico', 'civico'],
  'aniversario-uberlandia': ['historico', 'civico'],
  'aniversario-contagem': ['historico', 'civico'],
  'aniversario-vila-velha': ['historico', 'civico'],
  'aniversario-goiania': ['historico', 'civico'],
  'aniversario-sao-luis': ['historico', 'civico'],
  'aniversario-vitoria': ['historico', 'civico'],
  'aniversario-macapa': ['historico', 'civico'],
  'aniversario-fortaleza': ['historico', 'civico'],
  'aniversario-caucaia': ['historico', 'civico'],
  'aniversario-salvador': ['historico', 'civico'],
  'aniversario-feira-de-santana': ['historico', 'civico'],
  'aniversario-maceio': ['historico', 'civico'],
  'aniversario-manaus': ['historico', 'civico'],
  'aniversario-rio-branco': ['historico', 'civico'],
};

/**
 * @param {unknown[]} holidays
 * @returns {unknown[]}
 */
function assignCategories(holidays) {
  return holidays.map((holiday) => {
    if (!holiday || typeof holiday !== 'object' || !('id' in holiday)) {
      throw new Error('Invalid holiday entry');
    }
    const id = /** @type {{ id: string }} */ (holiday).id;
    const categories = CATEGORY_MAP[id];
    if (!categories) {
      throw new Error(`Missing category mapping for holiday id: ${id}`);
    }
    return { ...holiday, categories };
  });
}

/**
 * @param {string} filePath
 */
function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (Array.isArray(data)) {
    const updated = assignCategories(data);
    writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    return;
  }

  if (data && typeof data === 'object' && Array.isArray(data.holidays)) {
    const updated = { ...data, holidays: assignCategories(data.holidays) };
    writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    return;
  }

  throw new Error(`Unsupported file format: ${filePath}`);
}

/**
 * @param {string} dir
 */
function walkJsonFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkJsonFiles(fullPath);
      continue;
    }
    if (entry.endsWith('.json')) {
      processFile(fullPath);
      console.log(`Updated ${fullPath.replace(root, '')}`);
    }
  }
}

walkJsonFiles(holidaysDir);
console.log('Done assigning holiday categories.');
