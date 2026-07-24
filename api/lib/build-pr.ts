import {
  createBranch,
  createPullRequest,
  getDefaultBranchSha,
  getFileContent,
  putBinaryFileContent,
  putFileContent,
} from './github.js';
import {
  extensionFromMimeType,
  resolveArticlePath,
  resolveHolidayDataPath,
  resolveHolidayImagePath,
  slugify,
} from './holiday-paths.js';
import type { ContributionPayload } from './validation.js';

interface HolidayRecord {
  id: string;
  name: string;
  date?: string;
  dateRule?: string;
  type: string;
  categories: string[];
  description?: string;
}

interface StateHolidayFile {
  uf: string;
  name: string;
  slug: string;
  holidays: HolidayRecord[];
}

interface MunicipalityHolidayFile {
  ibgeCode: number;
  name: string;
  slug: string;
  uf: string;
  holidays: HolidayRecord[];
}

interface ArticleRecord {
  id: string;
  lead: string;
  legalBasis?: string;
  history: string[];
  traditions?: string[];
  funFacts?: string[];
  image?: {
    src: string;
    alt: string;
    credit?: string;
  };
  sources?: Array<{ label: string; url: string }>;
  contributors?: Array<{
    name: string;
    socialLabel: string;
    socialUrl: string;
    role: string;
  }>;
}

interface FileChange {
  path: string;
  content: string;
  message: string;
  isBinary?: boolean;
}

const SCOPE_LABELS: Record<string, string> = {
  national: 'Nacional',
  state: 'Estadual',
  municipal: 'Municipal',
};

function splitParagraphs(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined;
  const items = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function buildHolidayRecord(id: string, payload: ContributionPayload): HolidayRecord {
  const { holiday } = payload;
  const record: HolidayRecord = {
    id,
    name: holiday.name.trim(),
    type: holiday.type,
    categories: holiday.categories,
  };

  if (holiday.dateKind === 'fixed' && holiday.date) {
    record.date = holiday.date;
  } else if (holiday.dateRule) {
    record.dateRule = holiday.dateRule;
  }

  if (holiday.description?.trim()) {
    record.description = holiday.description.trim();
  }

  return record;
}

function mergeSources(
  existing: ArticleRecord | null,
  label: string,
  url: string,
): Array<{ label: string; url: string }> {
  const sources = existing?.sources ? [...existing.sources] : [];
  const trimmedLabel = label.trim();
  const trimmedUrl = url.trim();
  const alreadyExists = sources.some(
    (source) => source.label === trimmedLabel && source.url === trimmedUrl,
  );
  if (!alreadyExists) {
    sources.unshift({ label: trimmedLabel, url: trimmedUrl });
  }
  return sources;
}

function buildContributor(payload: ContributionPayload): ArticleRecord['contributors'] {
  const name = payload.contributorName?.trim();
  const socialLabel = payload.contributorSocialPlatform;
  const socialUrl = payload.contributorSocialUrl?.trim();

  if (!name || !socialLabel || !socialUrl) {
    return undefined;
  }

  const role =
    payload.type === 'suggest_holiday'
      ? 'suggestion'
      : payload.type === 'report_error'
        ? 'correction'
        : 'enrichment';

  return [{ name, socialLabel, socialUrl, role }];
}

function mergeContributors(
  existing: ArticleRecord | null,
  payload: ContributionPayload,
): ArticleRecord['contributors'] {
  const incoming = buildContributor(payload);
  if (!incoming) return existing?.contributors;

  const contributors = existing?.contributors ? [...existing.contributors] : [];
  for (const contributor of incoming) {
    const duplicate = contributors.some(
      (item) => item.name === contributor.name && item.socialUrl === contributor.socialUrl,
    );
    if (!duplicate) {
      contributors.push(contributor);
    }
  }
  return contributors;
}

function resolveImageSrc(
  payload: ContributionPayload,
  holidayId: string,
): { src: string; imagePath?: string; imageBase64?: string } {
  const { article } = payload;

  if (article.imageSource === 'url' && article.imageUrl?.trim()) {
    return { src: article.imageUrl.trim() };
  }

  if (!article.imageData || !article.imageMimeType) {
    return { src: '' };
  }

  const extension = extensionFromMimeType(article.imageMimeType);
  if (!extension) {
    throw new Error('Formato de imagem não suportado.');
  }

  const imagePath = resolveHolidayImagePath(holidayId, extension);
  return {
    src: `${holidayId}.${extension}`,
    imagePath,
    imageBase64: article.imageData,
  };
}

function buildArticleRecord(
  holidayId: string,
  payload: ContributionPayload,
  existing: ArticleRecord | null,
  imageSrc: string,
): ArticleRecord {
  const { article } = payload;
  const history = splitParagraphs(article.history) ?? existing?.history ?? [];
  const traditions = splitParagraphs(article.traditions) ?? existing?.traditions;
  const funFacts = splitParagraphs(article.funFacts) ?? existing?.funFacts;

  const record: ArticleRecord = {
    id: holidayId,
    lead: article.lead.trim() || existing?.lead || '',
    history,
    sources: mergeSources(existing, article.sourceLabel, article.sourceUrl),
    contributors: mergeContributors(existing, payload),
  };

  if (article.legalBasis?.trim() || existing?.legalBasis) {
    record.legalBasis = article.legalBasis?.trim() || existing?.legalBasis;
  }

  if (traditions) record.traditions = traditions;
  if (funFacts) record.funFacts = funFacts;

  if (imageSrc) {
    record.image = {
      src: imageSrc,
      alt: article.imageAlt.trim(),
      ...(article.imageCredit?.trim() ? { credit: article.imageCredit.trim() } : {}),
    };
  } else if (existing?.image) {
    record.image = {
      ...existing.image,
      alt: article.imageAlt.trim() || existing.image.alt,
      ...(article.imageCredit?.trim()
        ? { credit: article.imageCredit.trim() }
        : existing.image.credit
          ? { credit: existing.image.credit }
          : {}),
    };
  }

  return record;
}

function parseHolidayFile(
  scope: ContributionPayload['holiday']['scope'],
  content: string,
): StateHolidayFile | MunicipalityHolidayFile | HolidayRecord[] {
  const parsed: unknown = JSON.parse(content);
  if (scope === 'national') {
    if (!Array.isArray(parsed)) {
      throw new Error('Arquivo nacional inválido.');
    }
    return parsed as HolidayRecord[];
  }

  if (typeof parsed !== 'object' || parsed === null || !('holidays' in parsed)) {
    throw new Error('Arquivo de feriados inválido.');
  }

  return parsed as StateHolidayFile | MunicipalityHolidayFile;
}

function upsertHolidayInFile(
  scope: ContributionPayload['holiday']['scope'],
  fileContent: string,
  holiday: HolidayRecord,
  payload: ContributionPayload,
): string {
  if (scope === 'national') {
    const holidays = parseHolidayFile(scope, fileContent) as HolidayRecord[];
    const index = holidays.findIndex((item) => item.id === holiday.id);
    if (index >= 0) {
      holidays[index] = holiday;
    } else {
      holidays.push(holiday);
    }
    holidays.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return `${JSON.stringify(holidays, null, 2)}\n`;
  }

  const data = parseHolidayFile(scope, fileContent) as StateHolidayFile | MunicipalityHolidayFile;
  const index = data.holidays.findIndex((item) => item.id === holiday.id);
  if (index >= 0) {
    data.holidays[index] = holiday;
  } else {
    data.holidays.push(holiday);
  }
  data.holidays.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return `${JSON.stringify(data, null, 2)}\n`;
}

function createMunicipalityFile(
  payload: ContributionPayload,
  holiday: HolidayRecord,
): string {
  const uf = payload.holiday.state?.trim().toUpperCase() ?? '';
  const city = payload.holiday.city?.trim() ?? '';
  const citySlug = payload.holiday.citySlug?.trim() || slugify(city);
  const file: MunicipalityHolidayFile = {
    ibgeCode: 0,
    name: city,
    slug: citySlug,
    uf,
    holidays: [holiday],
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

function generateHolidayId(payload: ContributionPayload): string {
  if (payload.holidayId?.trim()) {
    return payload.holidayId.trim();
  }

  const citySlug = payload.holiday.citySlug?.trim() || slugify(payload.holiday.city ?? '');
  const base = slugify(payload.holiday.name);
  if (payload.holiday.scope === 'municipal' && citySlug) {
    return `${base}-${citySlug}`.slice(0, 80);
  }
  return base.slice(0, 80);
}

function buildPullRequestBody(
  payload: ContributionPayload,
  holidayId: string,
  files: string[],
): string {
  const lines = [
    '## Contribuição enviada pelo site',
    '',
    `- **Tipo:** ${payload.type}`,
    `- **ID do feriado:** \`${holidayId}\``,
    `- **Enviado em:** ${new Date().toISOString()}`,
  ];

  if (payload.pageUrl) {
    lines.push(`- **Página:** ${payload.pageUrl}`);
  }

  lines.push('', '### Resumo', '', payload.changeNotes?.trim() || '_Nova sugestão de feriado._');
  lines.push('', '### Fonte legal / referência', '', payload.source.trim());
  lines.push('', '### Arquivos alterados', '', ...files.map((file) => `- \`${file}\``));

  const wantsCredit =
    payload.contributorName?.trim() &&
    payload.contributorSocialPlatform &&
    payload.contributorSocialUrl?.trim();

  lines.push('', '### Crédito público', '');
  if (wantsCredit) {
    lines.push(
      `- **Nome:** ${payload.contributorName?.trim()}`,
      `- **Rede social:** ${payload.contributorSocialPlatform}`,
      `- **Perfil:** ${payload.contributorSocialUrl?.trim()}`,
      '',
      '> O contribuidor autorizou exibir nome e rede social na página do feriado, se aprovado.',
    );
  } else {
    lines.push('_O contribuidor não solicitou crédito público._');
  }

  lines.push(
    '',
    '---',
    '',
    '_Pull request criado automaticamente via formulário de contribuição do site. Revise os dados antes de fazer merge._',
  );

  return lines.join('\n');
}

function buildPullRequestTitle(payload: ContributionPayload, holidayId: string): string {
  const name = payload.holiday.name.trim();
  if (payload.type === 'suggest_holiday') {
    const scope = SCOPE_LABELS[payload.holiday.scope] ?? 'Não informado';
    return `[contribuição] Sugestão: ${name} (${scope})`;
  }
  if (payload.type === 'report_error') {
    return `[contribuição] Correção: ${name} (${holidayId})`;
  }
  return `[contribuição] Enriquecimento: ${name} (${holidayId})`;
}

export async function createContributionPullRequest(
  token: string,
  repo: string,
  payload: ContributionPayload,
): Promise<{ prUrl: string; prNumber: number }> {
  const holidayId = generateHolidayId(payload);
  const scope = payload.holiday.scope;
  const uf = payload.holiday.state?.trim().toUpperCase();
  const citySlug = payload.holiday.citySlug?.trim() || slugify(payload.holiday.city ?? '');

  const holidayRecord = buildHolidayRecord(holidayId, payload);
  const imageResolution = resolveImageSrc(payload, holidayId);

  const articlePath = resolveArticlePath(holidayId);
  const changes: FileChange[] = [];

  if (payload.type !== 'enrich_content') {
    const holidayPath = resolveHolidayDataPath(scope, uf, citySlug);
    const existingHolidayFile = await getFileContent(token, repo, holidayPath);

    let holidayContent: string;
    if (existingHolidayFile) {
      holidayContent = upsertHolidayInFile(scope, existingHolidayFile.content, holidayRecord, payload);
    } else if (scope === 'municipal') {
      holidayContent = createMunicipalityFile(payload, holidayRecord);
    } else {
      throw new Error(`Arquivo de feriados não encontrado: ${holidayPath}`);
    }

    changes.push({
      path: holidayPath,
      content: holidayContent,
      message: `data: ${payload.type === 'suggest_holiday' ? 'adicionar' : 'atualizar'} feriado ${holidayId}`,
    });
  }

  const existingArticleFile = await getFileContent(token, repo, articlePath);
  const existingArticle = existingArticleFile
    ? (JSON.parse(existingArticleFile.content) as ArticleRecord)
    : null;

  const articleRecord = buildArticleRecord(
    holidayId,
    payload,
    existingArticle,
    imageResolution.src,
  );

  changes.push({
    path: articlePath,
    content: `${JSON.stringify(articleRecord, null, 2)}\n`,
    message: `content: ${existingArticle ? 'atualizar' : 'adicionar'} artigo ${holidayId}`,
  });

  if (imageResolution.imagePath && imageResolution.imageBase64) {
    changes.push({
      path: imageResolution.imagePath,
      content: imageResolution.imageBase64,
      message: `assets: adicionar banner ${holidayId}`,
      isBinary: true,
    });
  }

  const baseSha = await getDefaultBranchSha(token, repo);
  const branchName = `contrib/${holidayId}-${Date.now()}`;
  await createBranch(token, repo, branchName, baseSha);

  for (const change of changes) {
    const existing = await getFileContent(token, repo, change.path, branchName);
    if (change.isBinary) {
      await putBinaryFileContent(
        token,
        repo,
        change.path,
        change.content,
        change.message,
        branchName,
        existing?.sha,
      );
    } else {
      await putFileContent(
        token,
        repo,
        change.path,
        change.content,
        change.message,
        branchName,
        existing?.sha,
      );
    }
  }

  const pr = await createPullRequest(
    token,
    repo,
    buildPullRequestTitle(payload, holidayId),
    buildPullRequestBody(payload, holidayId, changes.map((change) => change.path)),
    branchName,
  );

  return { prUrl: pr.html_url, prNumber: pr.number };
}
