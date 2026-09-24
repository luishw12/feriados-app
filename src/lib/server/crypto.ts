import { SESSION_SECRET } from 'astro:env/server';

const encoder = new TextEncoder();

function secret(): string {
  if (SESSION_SECRET) return SESSION_SECRET;
  if (import.meta.env.PROD) console.warn('[segurança] SESSION_SECRET não definido — usando segredo de desenvolvimento');
  return 'dev-secret-nao-use-em-producao';
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash com segredo do servidor (IPs, tokens de sessão). Irreversível. */
export function keyedHash(value: string): Promise<string> {
  return sha256(`${secret()}:${value}`);
}

export function randomId(bytes = 16): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** ID curto e legível para sugestões (ex.: "k3f9a2x7m1"). */
export function shortId(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  const buf = crypto.getRandomValues(new Uint8Array(10));
  return [...buf].map((b) => alphabet[b % alphabet.length]).join('');
}

export function clientIp(request: Request, fallback?: string): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    fallback ??
    'unknown'
  );
}
