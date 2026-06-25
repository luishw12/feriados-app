import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, 'src/data/articles');
const HOLIDAYS_DIR = path.join(ROOT, 'src/data/holidays');
const USER_AGENT = 'FeriadosBrasil/1.0 (https://feriados-brasil.vercel.app; educational project)';
const CREDIT = 'Wikimedia Commons — via Wikipédia';

const WIKI_BY_ID = {
  'confraternizacao-universal': 'Ano-Novo',
  'carnaval-segunda': 'Carnaval do Brasil',
  'carnaval-terca': 'Carnaval do Brasil',
  'quarta-cinzas': 'Quarta-feira de Cinzas',
  'sexta-santa': 'Sexta-feira Santa',
  pascoa: 'Páscoa',
  tiradentes: 'Tiradentes',
  'dia-do-trabalho': 'Dia do Trabalho',
  'corpus-christi': 'Corpus Christi',
  independencia: 'Independência do Brasil',
  'nossa-senhora-aparecida': 'Nossa Senhora Aparecida',
  finados: 'Dia de Finados',
  'proclamacao-republica': 'Proclamação da República do Brasil',
  'consciencia-negra': 'Dia da Consciência Negra',
  natal: 'Natal',
  'revolucao-farroupilha': 'Revolução Farroupilha',
  'dia-do-gaucho': 'Dia do Gaúcho',
  'inconfidencia-mineira': 'Inconfidência Mineira',
  'revolucao-constitucionalista': 'Revolução Constitucionalista de 1932',
  'revolucao-pernambucana': 'Revolução Pernambucana',
  'independencia-bahia': 'Independência da Bahia',
  'independencia-sergipe': 'Independência de Sergipe',
  'abolicao-ceara': 'Abolicionismo no Brasil',
  'colonizacao-es': 'Espírito Santo (estado)',
  'dia-de-santa-catarina': 'Santa Catarina (estado)',
  'dia-do-amazonense': 'Amazonas (estado)',
  'dia-do-piaui': 'Piauí',
  'dia-do-indio-mt': 'Dia do Índio',
  'dia-do-indio-rr': 'Dia do Índio',
  'dia-do-evangelho-df': 'Distrito Federal (Brasil)',
  'dia-do-evangelho-ro': 'Rondônia',
  'dia-do-estadista-ms': 'Mato Grosso do Sul',
  'eleicao-amazonas': 'Amazonas (estado)',
  'evangelizacao-indigenas-acre': 'Acre (estado)',
  'morte-lamartine-rn': 'Rio Grande do Norte',
  'fundacao-paraiba': 'Paraíba',
  'emancipacao-alagoas': 'Alagoas',
  'emancipacao-parana': 'Paraná',
  'adesao-maranhao': 'Maranhão',
  'adesao-para': 'Pará',
  'criacao-amapa': 'Amapá',
  'criacao-goias': 'Goiás',
  'criacao-ms': 'Mato Grosso do Sul',
  'criacao-mt': 'Mato Grosso',
  'criacao-para': 'Pará',
  'criacao-rondonia': 'Rondônia',
  'criacao-roraima': 'Roraima',
  'criacao-sc': 'Santa Catarina (estado)',
  'criacao-tocantins': 'Tocantins',
  'padroeira-ceara': 'Ceará',
  'padroeira-es': 'Espírito Santo (estado)',
  'padroeira-goias': 'Goiás',
  'padroeira-mg': 'Minas Gerais',
  'padroeira-pr': 'Paraná',
  'padroeira-sp': 'São Paulo (estado)',
  'nossa-senhora-natividade': 'Nossa Senhora da Natividade',
  'sao-jorge-rj': 'São Jorge',
  'sao-jose-amapa': 'São José',
  'sao-sebastiao-rj': 'São Sebastião',
  'sao-joao-alagoas': 'Festa junina',
  'sao-joao-bahia': 'Festa junina',
  'sao-joao-pe': 'Festa junina',
  'sao-joao-rn': 'Festa junina',
  'aniversario-acre': 'Acre (estado)',
  'aniversario-lajeado': 'Lajeado (Rio Grande do Sul)',
  'dia-da-mulher': 'Dia Internacional das Mulheres',
  'dia-da-mentira': 'Dia da Mentira',
  'dia-do-indio': 'Dia do Índio',
  'dia-da-terra': 'Dia da Terra',
  'dia-das-maes': 'Dia das Mães',
  'dia-da-familia': 'Dia Internacional da Família',
  'dia-do-meio-ambiente': 'Dia Mundial do Meio Ambiente',
  'dia-dos-namorados': 'Dia dos Namorados',
  'dia-de-sao-joao': 'Festa junina',
  'dia-do-amigo': 'Dia do Amigo',
  'dia-dos-avos': 'Dia dos Avós',
  'dia-do-estudante': 'Dia do Estudante',
  'dia-dos-pais': 'Dia dos Pais',
  'dia-do-folclore': 'Folclore do Brasil',
  'dia-do-cliente': 'Dia do Cliente',
  'dia-da-arvore': 'Dia da Árvore',
  'dia-do-idoso': 'Dia Internacional do Idoso',
  'dia-das-criancas': 'Dia das Crianças',
  'dia-do-professor': 'Dia do Professor',
  'dia-do-servidor-publico': 'Servidor público',
  'dia-da-bandeira': 'Dia da Bandeira',
  'combate-violencia-mulher': 'Dia Internacional da Eliminação da Violência contra as Mulheres',
};

const CITY_SLUG_TO_WIKI = {
  'rio-branco': 'Rio Branco',
  maceio: 'Maceió',
  manaus: 'Manaus',
  macapa: 'Macapá',
  'feira-de-santana': 'Feira de Santana',
  salvador: 'Salvador',
  caucaia: 'Caucaia',
  fortaleza: 'Fortaleza',
  brasilia: 'Brasília',
  'vila-velha': 'Vila Velha',
  vitoria: 'Vitória (Espírito Santo)',
  goiania: 'Goiânia',
  'sao-luis': 'São Luís (Maranhão)',
  'belo-horizonte': 'Belo Horizonte',
  contagem: 'Contagem',
  uberlandia: 'Uberlândia',
  'campo-grande': 'Campo Grande (Mato Grosso do Sul)',
  cuiaba: 'Cuiabá',
  belem: 'Belém (Pará)',
  'joao-pessoa': 'João Pessoa',
  'jaboatao-dos-guararapes': 'Jaboatão dos Guararapes',
  recife: 'Recife',
  teresina: 'Teresina',
  curitiba: 'Curitiba',
  londrina: 'Londrina',
  'rio-de-janeiro': 'Rio de Janeiro',
  'sao-goncalo': 'São Gonçalo (Rio de Janeiro)',
  natal: 'Natal (Rio Grande do Norte)',
  'porto-velho': 'Porto Velho',
  'boa-vista': 'Boa Vista (Roraima)',
  canoas: 'Canoas',
  'caxias-do-sul': 'Caxias do Sul',
  lajeado: 'Lajeado',
  pelotas: 'Pelotas',
  'porto-alegre': 'Porto Alegre',
  'santa-maria': 'Santa Maria (Rio Grande do Sul)',
  florianopolis: 'Florianópolis',
  joinville: 'Joinville',
  aracaju: 'Aracaju',
  campinas: 'Campinas',
  guarulhos: 'Guarulhos',
  'sao-bernardo-do-campo': 'São Bernardo do Campo',
  'sao-paulo': 'São Paulo',
  palmas: 'Palmas (Tocantins)',
};

function walkJsonFiles(directory) {
  const entries = [];
  for (const entry of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      entries.push(...walkJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      entries.push(fullPath);
    }
  }
  return entries;
}

function collectHolidayNames() {
  const map = new Map();
  for (const file of walkJsonFiles(HOLIDAYS_DIR)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const holidays = Array.isArray(data) ? data : data.holidays ?? [];
    for (const holiday of holidays) {
      if (!map.has(holiday.id)) map.set(holiday.id, holiday.name);
    }
  }
  return map;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.includes('/thumb/')) {
    return url.replace(/\/\d+px-/, '/1280px-');
  }
  const match = url.match(/wikipedia\/commons\/(.+)$/);
  if (match) {
    const filePath = match[1];
    const file = filePath.split('/').pop() ?? filePath;
    const encodedPath = filePath
      .split('/')
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join('/');
    const encodedFile = encodeURIComponent(decodeURIComponent(file));
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${encodedPath}/1280px-${encodedFile}`;
  }
  return url;
}

async function getWikiThumb(title) {
  const response = await fetch(
    `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { 'User-Agent': USER_AGENT } },
  );
  if (!response.ok) return null;
  const data = await response.json();
  return normalizeImageUrl(data.thumbnail?.source ?? null);
}

function buildCandidates(id, holidayName) {
  const candidates = [];

  if (WIKI_BY_ID[id]) candidates.push(WIKI_BY_ID[id]);

  if (id.startsWith('aniversario-')) {
    const slug = id.replace('aniversario-', '');
    if (CITY_SLUG_TO_WIKI[slug]) candidates.push(CITY_SLUG_TO_WIKI[slug]);
  }

  if (holidayName) candidates.push(holidayName);

  candidates.push('Brasil', 'Feriados no Brasil');

  return [...new Set(candidates)];
}

async function resolveImage(id, holidayName) {
  const candidates = buildCandidates(id, holidayName);

  for (const title of candidates) {
    const src = await getWikiThumb(title);
    if (src) {
      return {
        src,
        alt: `${holidayName} — ${title}`,
        credit: CREDIT,
      };
    }
    await sleep(150);
  }

  return null;
}

async function main() {
  const holidayNames = collectHolidayNames();
  const files = fs.readdirSync(ARTICLES_DIR).filter((file) => file.endsWith('.json'));
  const cache = new Map();
  let updated = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const holidayName = holidayNames.get(article.id) ?? article.id;
    const cacheKey = article.id;

    let image = cache.get(cacheKey);
    if (!image) {
      image = await resolveImage(article.id, holidayName);
      if (image) cache.set(cacheKey, image);
    }

    if (!image) {
      console.warn(`Sem imagem: ${article.id}`);
      failed += 1;
      continue;
    }

    article.image = image;
    fs.writeFileSync(filePath, `${JSON.stringify(article, null, 2)}\n`, 'utf8');
    updated += 1;
    process.stdout.write(`\r${updated}/${files.length}`);
  }

  console.log(`\nConcluído: ${updated} com imagem, ${failed} sem resultado.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
