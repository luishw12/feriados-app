/**
 * Toda alteração de dados passa por aqui: grava o feriado, registra a revisão,
 * invalida o cache do CDN só nas páginas afetadas e avisa os buscadores.
 */
import type { APIContext, AstroGlobal } from 'astro';
import { eq } from 'drizzle-orm';
import { invalidate } from '../cache';
import { getDb, schema } from '../db/client';
import { CATEGORIES, KINDS, SCOPES, STATUSES, type Category, type HolidayRow, type SuggestionRow } from '../db/schema';
import { getCityByIbge, getState } from '../data';
import { isValidRule } from '../holidays/rules';
import { paths } from '../site';
import type { Admin } from './auth';
import { sendMail } from './email';
import { pingIndexNow } from './indexnow';

type Ctx = Pick<AstroGlobal | APIContext, 'cache' | 'site' | 'url'>;

export interface HolidayForm {
  id: string;
  name: string;
  scope: HolidayRow['scope'];
  uf: string | null;
  ibge: number | null;
  kind: HolidayRow['kind'];
  rule: string;
  validFrom: number | null;
  validTo: number | null;
  categories: Category[];
  summary: string;
  body: string;
  legalBasis: string;
  sourceUrl: string;
  status: HolidayRow['status'];
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function str(form: FormData, key: string, max: number): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function optionalYear(form: FormData, key: string): number | null {
  const value = str(form, key, 4);
  return /^\d{4}$/.test(value) ? Number(value) : null;
}

function oneOf<T extends string>(value: string, options: readonly T[]): T | null {
  return (options as readonly string[]).includes(value) ? (value as T) : null;
}

/** Lê e valida o formulário de feriado do painel. */
export async function parseHolidayForm(form: FormData): Promise<{ value: HolidayForm } | { error: string }> {
  const name = str(form, 'name', 120);
  const scope = oneOf(str(form, 'scope', 20), SCOPES);
  const kind = oneOf(str(form, 'kind', 20), KINDS);
  const status = oneOf(str(form, 'status', 20), STATUSES);
  const rule = str(form, 'rule', 20);
  const sourceUrl = str(form, 'sourceUrl', 500);
  if (name.length < 2) return { error: 'Nome muito curto' };
  if (!scope || !kind || !status) return { error: 'Abrangência, tipo ou status inválido' };
  if (!isValidRule(rule)) return { error: `Regra de data inválida: "${rule}"` };
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) return { error: 'A fonte precisa ser um link http(s)' };

  let uf: string | null = null;
  let ibge: number | null = null;
  if (scope === 'municipal') {
    const city = await getCityByIbge(Number(str(form, 'ibge', 7)));
    if (!city) return { error: 'Código IBGE da cidade inválido' };
    ibge = city.ibge;
    uf = city.uf;
  } else if (scope === 'state') {
    const state = await getState(str(form, 'uf', 2));
    if (!state) return { error: 'UF inválida' };
    uf = state.uf;
  }

  const categories = form.getAll('categories').filter((c): c is Category => typeof c === 'string' && (CATEGORIES as readonly string[]).includes(c));
  const validFrom = optionalYear(form, 'validFrom');
  const validTo = optionalYear(form, 'validTo');
  if (validFrom && validTo && validFrom > validTo) return { error: 'Validade: ano inicial maior que o final' };

  return {
    value: {
      id: slugify(str(form, 'id', 120)),
      name,
      scope,
      uf,
      ibge,
      kind,
      rule,
      validFrom,
      validTo,
      categories,
      summary: str(form, 'summary', 300),
      body: str(form, 'body', 8000),
      legalBasis: str(form, 'legalBasis', 300),
      sourceUrl,
      status,
    },
  };
}

/** Sugere um ID único: nome + cidade/UF para feriados locais. */
export async function suggestId(name: string, scope: HolidayRow['scope'], uf: string | null, ibge: number | null): Promise<string> {
  let base = slugify(name);
  if (scope === 'municipal' && ibge) {
    const city = await getCityByIbge(ibge);
    if (city) base = `${base}-${city.slug}-${city.uf.toLowerCase()}`;
  } else if (scope === 'state' && uf) base = `${base}-${uf.toLowerCase()}`;
  let candidate = base;
  for (let n = 2; ; n++) {
    const [exists] = await getDb().select({ id: schema.holidays.id }).from(schema.holidays).where(eq(schema.holidays.id, candidate)).limit(1);
    if (!exists) return candidate;
    candidate = `${base}-${n}`;
  }
}

/** Tags de cache e caminhos públicos afetados por um feriado. */
export function affected(h: Pick<HolidayRow, 'id' | 'scope' | 'uf' | 'ibge'>, citySlug?: string | null): { tags: string[]; paths: string[] } {
  const tags = [`h:${h.id}`, 'sitemap'];
  const urls = [paths.holiday(h.id)];
  if (h.scope === 'national') tags.push('national');
  if (h.scope === 'state' && h.uf) {
    tags.push(`uf:${h.uf}`, 'index', 'llms');
    urls.push(paths.state(h.uf));
  }
  if (h.scope === 'municipal' && h.ibge) {
    tags.push(`city:${h.ibge}`);
    if (h.uf && citySlug) urls.push(paths.city(h.uf, citySlug));
  }
  if (h.scope === 'national') urls.push(paths.home(), paths.year(new Date().getFullYear()));
  return { tags, paths: urls };
}

function snapshot(h: HolidayRow | HolidayForm): Record<string, unknown> {
  const { id, name, scope, uf, ibge, kind, rule, validFrom, validTo, categories, summary, body, legalBasis, sourceUrl, status } = h;
  return { id, name, scope, uf, ibge, kind, rule, validFrom, validTo, categories, summary, body, legalBasis, sourceUrl, status };
}

async function publish(ctx: Ctx, holidays: Pick<HolidayRow, 'id' | 'scope' | 'uf' | 'ibge'>[]): Promise<void> {
  const tags = new Set<string>();
  const urls: string[] = [];
  for (const h of holidays) {
    const city = h.ibge ? await getCityByIbge(h.ibge) : null;
    const a = affected(h, city?.slug);
    a.tags.forEach((t) => tags.add(t));
    urls.push(...a.paths);
  }
  await invalidate(ctx, [...tags]);
  await pingIndexNow(ctx.site ?? new URL(ctx.url.origin), urls);
}

/** Cria ou atualiza um feriado (id existente = atualização). */
export async function saveHoliday(ctx: Ctx, admin: Admin, value: HolidayForm, suggestionId: string | null = null): Promise<HolidayRow> {
  const db = getDb();
  const [before] = await db.select().from(schema.holidays).where(eq(schema.holidays.id, value.id)).limit(1);
  const now = new Date();
  const { id, ...fields } = value;
  if (before) {
    await db.batch([
      db
        .update(schema.holidays)
        .set({ ...fields, updatedAt: now })
        .where(eq(schema.holidays.id, id)),
      db.insert(schema.revisions).values({ holidayId: id, action: 'update', before: snapshot(before), after: snapshot(value), suggestionId, author: admin.login, createdAt: now }),
    ]);
  } else {
    await db.batch([
      db.insert(schema.holidays).values({ id, ...fields, createdAt: now, updatedAt: now }),
      db.insert(schema.revisions).values({ holidayId: id, action: 'create', before: null, after: snapshot(value), suggestionId, author: admin.login, createdAt: now }),
    ]);
  }
  const [saved] = await db.select().from(schema.holidays).where(eq(schema.holidays.id, id)).limit(1);
  // Se mudou de lugar (ex.: estadual → municipal), invalida o antigo também.
  await publish(ctx, before ? [before, saved!] : [saved!]);
  return saved!;
}

export async function deleteHoliday(ctx: Ctx, admin: Admin, id: string, suggestionId: string | null = null): Promise<void> {
  const db = getDb();
  const [before] = await db.select().from(schema.holidays).where(eq(schema.holidays.id, id)).limit(1);
  if (!before) return;
  const city = before.ibge ? await getCityByIbge(before.ibge) : null;
  const target = city ? paths.city(city.uf, city.slug) : before.uf ? paths.state(before.uf) : paths.home();
  await db.batch([
    db.delete(schema.holidays).where(eq(schema.holidays.id, id)),
    db.insert(schema.revisions).values({ holidayId: id, action: 'delete', before: snapshot(before), after: null, suggestionId, author: admin.login }),
    db
      .insert(schema.redirects)
      .values({ fromPath: paths.holiday(id), toPath: target })
      .onConflictDoUpdate({ target: schema.redirects.fromPath, set: { toPath: target } }),
  ]);
  await publish(ctx, [before]);
}

export async function setOverride(ctx: Ctx, admin: Admin, holidayId: string, year: number, date: string | null, note: string): Promise<void> {
  const db = getDb();
  const [holiday] = await db.select().from(schema.holidays).where(eq(schema.holidays.id, holidayId)).limit(1);
  if (!holiday) return;
  await db
    .insert(schema.holidayOverrides)
    .values({ holidayId, year, date, note })
    .onConflictDoUpdate({ target: [schema.holidayOverrides.holidayId, schema.holidayOverrides.year], set: { date, note } });
  await db.update(schema.holidays).set({ updatedAt: new Date() }).where(eq(schema.holidays.id, holidayId));
  await db.insert(schema.revisions).values({ holidayId, action: 'update', before: null, after: { override: { year, date, note } }, author: admin.login });
  await publish(ctx, [holiday]);
}

export async function removeOverride(ctx: Ctx, holidayId: string, overrideId: number): Promise<void> {
  const db = getDb();
  const [holiday] = await db.select().from(schema.holidays).where(eq(schema.holidays.id, holidayId)).limit(1);
  await db.delete(schema.holidayOverrides).where(eq(schema.holidayOverrides.id, overrideId));
  if (holiday) await publish(ctx, [holiday]);
}

export async function closeSuggestion(
  ctx: Ctx,
  admin: Admin,
  suggestion: SuggestionRow,
  status: 'approved' | 'rejected' | 'spam',
  note: string,
  holidayId?: string,
): Promise<void> {
  await getDb()
    .update(schema.suggestions)
    .set({ status, reviewNote: note, reviewedBy: admin.login, reviewedAt: new Date(), ...(holidayId ? { holidayId } : {}) })
    .where(eq(schema.suggestions.id, suggestion.id));

  if (suggestion.contributorEmail && status !== 'spam') {
    const site = ctx.site ?? new URL(ctx.url.origin);
    const approved = status === 'approved';
    await sendMail({
      to: suggestion.contributorEmail,
      subject: approved ? 'Sua sugestão foi aprovada — obrigado!' : 'Sobre a sua sugestão no Feriados Brasil',
      text: approved
        ? `Olá${suggestion.contributorName ? `, ${suggestion.contributorName}` : ''}!\n\nSua sugestão foi aprovada e já está no ar. Obrigado por ajudar a manter os feriados do Brasil corretos.${note ? `\n\nNota do revisor: ${note}` : ''}`
        : `Olá${suggestion.contributorName ? `, ${suggestion.contributorName}` : ''}!\n\nRevisamos a sua sugestão e, desta vez, ela não foi aplicada.${note ? `\n\nMotivo: ${note}` : ''}\n\nObrigado por contribuir — se tiver uma fonte oficial (lei ou site da prefeitura), envie de novo.`,
      ...(approved && holidayId ? { link: { href: new URL(paths.holiday(holidayId), site).href, label: 'Ver no site' } } : {}),
    });
  }
}
