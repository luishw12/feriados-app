type ContributionMode = 'suggest_holiday' | 'report_error' | 'enrich_content';
type HolidayScope = 'national' | 'state' | 'municipal';
type SocialPlatform = 'LinkedIn' | 'Instagram' | 'X' | 'GitHub' | 'Outro';

/**
 * Segurança: GITHUB_TOKEN e GITHUB_REPO existem APENAS em process.env no servidor Vercel.
 * Nunca use prefixo PUBLIC_, nunca importe este arquivo no cliente, nunca logue o token.
 */

interface ContributionPayload {
  type: ContributionMode;
  holidayName?: string;
  holidayId?: string;
  pageUrl?: string;
  scope?: HolidayScope;
  state?: string;
  city?: string;
  date?: string;
  description?: string;
  message?: string;
  source: string;
  contributorName?: string;
  contributorSocialPlatform?: SocialPlatform;
  contributorSocialUrl?: string;
  website?: string;
}

interface VercelRequest {
  method?: string;
  body?: ContributionPayload | string | Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const CONTRIBUTION_MODES: ContributionMode[] = [
  'suggest_holiday',
  'report_error',
  'enrich_content',
];

const HOLIDAY_SCOPES: HolidayScope[] = ['national', 'state', 'municipal'];

const SOCIAL_PLATFORMS: SocialPlatform[] = ['LinkedIn', 'Instagram', 'X', 'GitHub', 'Outro'];

const FORBIDDEN_BODY_KEYS = [
  'token',
  'authorization',
  'password',
  'secret',
  'apikey',
  'api_key',
  'github_token',
  'github_repo',
  'bearer',
];

const SCOPE_LABELS: Record<HolidayScope, string> = {
  national: 'Nacional',
  state: 'Estadual',
  municipal: 'Municipal',
};

function getHeader(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function getAllowedHosts(): Set<string> {
  const allowed = new Set<string>([
    'localhost:4321',
    'localhost:3000',
    '127.0.0.1:4321',
    '127.0.0.1:3000',
  ]);

  const siteUrl = process.env.PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).host);
    } catch {
      // URL inválida — ignorar
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    allowed.add(vercelUrl);
  }

  return allowed;
}

function isAllowedOrigin(req: VercelRequest): boolean {
  const allowedHosts = getAllowedHosts();

  const origin = getHeader(req, 'origin');
  if (origin) {
    try {
      return allowedHosts.has(new URL(origin).host);
    } catch {
      return false;
    }
  }

  const referer = getHeader(req, 'referer');
  if (referer) {
    try {
      return allowedHosts.has(new URL(referer).host);
    } catch {
      return false;
    }
  }

  return false;
}

function truncate(value: string | undefined, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  return value.trim().slice(0, maxLength);
}

function readOptionalString(
  raw: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | undefined {
  const value = raw[key];
  if (typeof value !== 'string') return undefined;
  return truncate(value, maxLength);
}

function isHolidayScope(value: string): value is HolidayScope {
  return (HOLIDAY_SCOPES as readonly string[]).includes(value);
}

function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

function isContributionMode(value: string): value is ContributionMode {
  return (CONTRIBUTION_MODES as readonly string[]).includes(value);
}

function hasForbiddenKeys(raw: Record<string, unknown>): boolean {
  return Object.keys(raw).some((key) => FORBIDDEN_BODY_KEYS.includes(key.toLowerCase()));
}

function sanitizePayload(raw: Record<string, unknown>): ContributionPayload | null {
  if (hasForbiddenKeys(raw)) return null;

  const typeValue = raw.type;
  if (typeof typeValue !== 'string' || !isContributionMode(typeValue)) return null;

  const scopeValue = raw.scope;
  const scope =
    typeof scopeValue === 'string' && isHolidayScope(scopeValue) ? scopeValue : undefined;

  const socialValue = raw.contributorSocialPlatform;
  const contributorSocialPlatform =
    typeof socialValue === 'string' && isSocialPlatform(socialValue) ? socialValue : undefined;

  const source = readOptionalString(raw, 'source', 5000) ?? '';

  return {
    type: typeValue,
    holidayName: readOptionalString(raw, 'holidayName', 200),
    holidayId: readOptionalString(raw, 'holidayId', 100),
    pageUrl: readOptionalString(raw, 'pageUrl', 500),
    scope,
    state: readOptionalString(raw, 'state', 2),
    city: readOptionalString(raw, 'city', 100),
    date: readOptionalString(raw, 'date', 100),
    description: readOptionalString(raw, 'description', 5000),
    message: readOptionalString(raw, 'message', 5000),
    source,
    contributorName: readOptionalString(raw, 'contributorName', 100),
    contributorSocialPlatform,
    contributorSocialUrl: readOptionalString(raw, 'contributorSocialUrl', 500),
    website: readOptionalString(raw, 'website', 200),
  };
}

function isValidRepo(repo: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validatePayload(payload: ContributionPayload): string | null {
  if (isNonEmpty(payload.website)) {
    return '__honeypot__';
  }

  if (!isNonEmpty(payload.source)) {
    return 'Informe uma fonte oficial ou referência.';
  }

  const hasContributorName = isNonEmpty(payload.contributorName);
  const hasSocialPlatform = isNonEmpty(payload.contributorSocialPlatform);
  const hasSocialUrl = isNonEmpty(payload.contributorSocialUrl);

  if (hasContributorName || hasSocialPlatform || hasSocialUrl) {
    if (!hasContributorName || !hasSocialPlatform || !hasSocialUrl) {
      return 'Preencha nome, rede social e link do perfil para crédito público.';
    }
    if (!isValidUrl(payload.contributorSocialUrl)) {
      return 'O link da rede social deve ser uma URL válida.';
    }
  }

  if (payload.type === 'suggest_holiday') {
    if (!isNonEmpty(payload.holidayName)) return 'Informe o nome do feriado.';
    if (!payload.scope) return 'Selecione o escopo do feriado.';
    if (payload.scope !== 'national' && !isNonEmpty(payload.state)) {
      return 'Informe o estado (UF) do feriado.';
    }
    if (payload.scope === 'municipal' && !isNonEmpty(payload.city)) {
      return 'Informe a cidade do feriado.';
    }
    if (!isNonEmpty(payload.date)) return 'Informe a data do feriado.';
    return null;
  }

  if (!isNonEmpty(payload.holidayName)) return 'Feriado não identificado.';
  if (!isNonEmpty(payload.message)) {
    return payload.type === 'report_error'
      ? 'Descreva o que está incorreto.'
      : 'Descreva a informação que deseja adicionar.';
  }

  return null;
}

function buildIssueTitle(payload: ContributionPayload): string {
  const name = payload.holidayName?.trim() ?? 'Feriado';

  if (payload.type === 'suggest_holiday') {
    const scope = payload.scope ? SCOPE_LABELS[payload.scope] : 'Não informado';
    return `[contribuição] Sugestão: ${name} (${scope})`;
  }

  if (payload.type === 'report_error') {
    return `[contribuição] Correção: ${name}`;
  }

  return `[contribuição] Enriquecimento: ${name}`;
}

function buildIssueBody(payload: ContributionPayload): string {
  const lines: string[] = [
    '## Contribuição enviada pelo site',
    '',
    `- **Tipo:** ${payload.type}`,
    `- **Enviado em:** ${new Date().toISOString()}`,
  ];

  if (payload.pageUrl) {
    lines.push(`- **Página:** ${payload.pageUrl}`);
  }

  if (payload.holidayId) {
    lines.push(`- **ID do feriado:** \`${payload.holidayId}\``);
  }

  lines.push('');

  if (payload.type === 'suggest_holiday') {
    lines.push('### Dados do feriado sugerido', '');
    lines.push(`- **Nome:** ${payload.holidayName?.trim()}`);
    if (payload.scope) {
      lines.push(`- **Escopo:** ${SCOPE_LABELS[payload.scope]}`);
    }
    if (payload.state) lines.push(`- **Estado:** ${payload.state.trim().toUpperCase()}`);
    if (payload.city) lines.push(`- **Cidade:** ${payload.city.trim()}`);
    lines.push(`- **Data:** ${payload.date?.trim()}`);
    if (isNonEmpty(payload.description)) {
      lines.push('', '### Descrição', '', payload.description.trim());
    }
  } else {
    const sectionTitle =
      payload.type === 'report_error' ? '### O que está incorreto' : '### Informação adicional';
    lines.push(`- **Feriado:** ${payload.holidayName?.trim()}`, '', sectionTitle, '', payload.message?.trim());
  }

  lines.push('', '### Fonte', '', payload.source.trim());

  const wantsCredit =
    isNonEmpty(payload.contributorName) &&
    isNonEmpty(payload.contributorSocialPlatform) &&
    isNonEmpty(payload.contributorSocialUrl);

  lines.push('', '### Crédito público', '');
  if (wantsCredit) {
    lines.push(
      `- **Nome:** ${payload.contributorName.trim()}`,
      `- **Rede social:** ${payload.contributorSocialPlatform}`,
      `- **Perfil:** ${payload.contributorSocialUrl.trim()}`,
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
    '_Issue criada automaticamente via formulário de contribuição do site._',
  );

  return lines.join('\n');
}

function getIssueLabels(payload: ContributionPayload): string[] {
  const labels = ['contribution'];
  if (payload.type === 'enrich_content') {
    labels.push('content');
  } else {
    labels.push('data');
  }
  return labels;
}

function parseBody(body: VercelRequest['body']): ContributionPayload | null {
  if (!body) return null;

  let raw: Record<string, unknown>;
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      if (typeof parsed !== 'object' || parsed === null) return null;
      raw = parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof body === 'object') {
    raw = body as Record<string, unknown>;
  } else {
    return null;
  }

  return sanitizePayload(raw);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ ok: false, error: 'Origem não permitida.' });
    return;
  }

  const payload = parseBody(req.body);
  if (!payload) {
    res.status(400).json({ ok: false, error: 'Dados inválidos.' });
    return;
  }

  const validationError = validatePayload(payload);
  if (validationError === '__honeypot__') {
    res.status(200).json({ ok: true, issueUrl: '' });
    return;
  }

  if (validationError) {
    res.status(400).json({ ok: false, error: validationError });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token || !repo || !isValidRepo(repo)) {
    res.status(503).json({ ok: false, error: 'Serviço temporariamente indisponível.' });
    return;
  }

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: buildIssueTitle(payload),
        body: buildIssueBody(payload),
        labels: getIssueLabels(payload),
      }),
    });
  } catch {
    res.status(502).json({ ok: false, error: 'Não foi possível registrar sua contribuição.' });
    return;
  }

  if (!response.ok) {
    // Nunca repassar corpo/headers da API do GitHub ao cliente — pode conter detalhes internos.
    res.status(502).json({ ok: false, error: 'Não foi possível registrar sua contribuição.' });
    return;
  }

  const issue: unknown = await response.json();
  const issueUrl =
    typeof issue === 'object' && issue !== null && 'html_url' in issue
      ? String((issue as Record<string, unknown>).html_url)
      : '';

  res.status(200).json({ ok: true, issueUrl });
}
