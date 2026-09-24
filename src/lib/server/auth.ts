import type { AstroCookies } from 'astro';
import { and, eq, gt, lt } from 'drizzle-orm';
import { ADMIN_GITHUB_LOGINS, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from 'astro:env/server';
import { getDb, schema } from '../db/client';
import { randomId, sha256 } from './crypto';

export interface Admin {
  login: string;
  name: string;
  avatarUrl: string;
}

const COOKIE = 'fb_admin';
/** Cookie visível ao JS só para a interface mostrar atalhos "Editar". Não dá acesso a nada. */
export const HINT_COOKIE = 'fb_admin_hint';
const STATE_COOKIE = 'fb_oauth_state';
const SESSION_DAYS = 30;

export const oauthConfigured = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
/** Sem OAuth configurado, o login local só é permitido em `astro dev`. */
export const devLoginAllowed = import.meta.env.DEV && !oauthConfigured;

function allowedLogins(): string[] {
  return (ADMIN_GITHUB_LOGINS ?? '')
    .split(',')
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(login: string): boolean {
  return allowedLogins().includes(login.toLowerCase());
}

function cookieOptions(maxAgeSeconds: number) {
  return { path: '/', httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax' as const, maxAge: maxAgeSeconds };
}

export async function createSession(cookies: AstroCookies, admin: Admin): Promise<void> {
  const token = randomId(32);
  const db = getDb();
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  await db.insert(schema.sessions).values({
    id: await sha256(token),
    login: admin.login,
    name: admin.name,
    avatarUrl: admin.avatarUrl,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  cookies.set(COOKIE, token, cookieOptions(SESSION_DAYS * 86_400));
  cookies.set(HINT_COOKIE, '1', { ...cookieOptions(SESSION_DAYS * 86_400), httpOnly: false });
}

export async function getAdmin(cookies: AstroCookies): Promise<Admin | null> {
  const token = cookies.get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await getDb()
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, await sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  // Um login removido da allowlist perde o acesso na hora (exceto o usuário de dev).
  if (!(row.login === 'dev' && devLoginAllowed) && !isAllowed(row.login)) return null;
  return { login: row.login, name: row.name, avatarUrl: row.avatarUrl };
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(COOKIE)?.value;
  if (token) await getDb().delete(schema.sessions).where(eq(schema.sessions.id, await sha256(token)));
  cookies.delete(COOKIE, { path: '/' });
  cookies.delete(HINT_COOKIE, { path: '/' });
}

export function githubAuthorizeUrl(cookies: AstroCookies, redirectUri: string): string {
  const state = randomId(16);
  cookies.set(STATE_COOKIE, state, cookieOptions(600));
  const params = new URLSearchParams({ client_id: GITHUB_CLIENT_ID ?? '', redirect_uri: redirectUri, state, scope: 'read:user', allow_signup: 'false' });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function completeGithubLogin(cookies: AstroCookies, code: string, state: string, redirectUri: string): Promise<Admin | { error: string }> {
  const expected = cookies.get(STATE_COOKIE)?.value;
  cookies.delete(STATE_COOKIE, { path: '/' });
  if (!expected || expected !== state) return { error: 'Sessão de login expirada. Tente de novo.' };
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri }),
  });
  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) return { error: 'O GitHub recusou o login.' };
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/vnd.github+json', 'user-agent': 'feriados-brasil' },
  });
  const user = (await userResponse.json()) as { login?: string; name?: string | null; avatar_url?: string };
  if (!user.login) return { error: 'Não foi possível ler o usuário do GitHub.' };
  if (!isAllowed(user.login)) return { error: `@${user.login} não tem acesso ao painel.` };
  const admin = { login: user.login, name: user.name || user.login, avatarUrl: user.avatar_url ?? '' };
  await createSession(cookies, admin);
  return admin;
}
