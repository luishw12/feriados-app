import { createContributionPullRequest } from './lib/build-pr.js';
import { sanitizePayload, validatePayload } from './lib/validation.js';

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

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

function isValidRepo(repo: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

function parseBody(body: VercelRequest['body']): ReturnType<typeof sanitizePayload> {
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
    res.status(200).json({ ok: true, prUrl: '' });
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

  try {
    const { prUrl } = await createContributionPullRequest(token, repo, payload);
    res.status(200).json({ ok: true, prUrl });
  } catch {
    res.status(502).json({ ok: false, error: 'Não foi possível registrar sua contribuição.' });
  }
}
