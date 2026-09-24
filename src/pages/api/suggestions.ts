import type { APIRoute } from 'astro';
import { getDb, isReadOnly, schema } from '@/lib/db/client';
import type { SuggestionPayload } from '@/lib/db/schema';
import { getCityByIbge, getHoliday, getState } from '@/lib/data';
import { describeRule } from '@/lib/holidays/rules';
import { clientIp, keyedHash, shortId } from '@/lib/server/crypto';
import { adminEmail, sendMail } from '@/lib/server/email';
import { rateLimit } from '@/lib/server/ratelimit';
import { SUGGESTION_TYPE_LABEL, suggestionInput } from '@/lib/server/suggestions';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { placeLabel } from '@/lib/site';

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export const POST: APIRoute = async (ctx) => {
  ctx.cache.set(false);
  const origin = ctx.request.headers.get('origin');
  if (origin && new URL(origin).host !== ctx.url.host) return reply(403, { error: 'Origem não permitida' });
  if (isReadOnly) return reply(503, { error: 'Sugestões estão temporariamente desativadas neste ambiente.' });

  let raw: unknown;
  try {
    raw = await ctx.request.json();
  } catch {
    return reply(400, { error: 'Requisição inválida' });
  }
  const parsed = suggestionInput.safeParse(raw);
  if (!parsed.success) return reply(400, { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
  const input = parsed.data;

  // Honeypot: robôs preenchem o campo escondido. Finge sucesso.
  if (input.website) return reply(201, { ok: true });

  const ip = clientIp(ctx.request, ctx.clientAddress);
  const ipHash = await keyedHash(ip);
  if (!(await rateLimit(`suggest:h:${ipHash}`, 6, 3600)) || !(await rateLimit(`suggest:d:${ipHash}`, 25, 86_400))) {
    return reply(429, { error: 'Muitas sugestões em pouco tempo. Tente de novo mais tarde.' });
  }
  if (!(await verifyTurnstile(input.turnstileToken, ip))) return reply(400, { error: 'Não foi possível confirmar que você não é um robô. Recarregue e tente de novo.' });

  const holiday = input.holidayId ? await getHoliday(input.holidayId) : null;
  if (input.holidayId && !holiday) return reply(400, { error: 'Feriado não encontrado' });
  const city = input.ibge ? await getCityByIbge(input.ibge) : null;
  if (input.ibge && !city) return reply(400, { error: 'Cidade não encontrada' });
  const uf = city?.uf ?? input.uf ?? holiday?.uf ?? null;
  const state = uf ? await getState(uf) : null;
  if (uf && !state) return reply(400, { error: 'Estado inválido' });

  const id = shortId();
  await getDb()
    .insert(schema.suggestions)
    .values({
      id,
      type: input.type,
      holidayId: holiday?.id ?? null,
      uf: state?.uf ?? null,
      ibge: city?.ibge ?? holiday?.ibge ?? null,
      payload: Object.fromEntries(
        Object.entries({ ...input.proposal, placeText: input.placeText, national: input.national && !city && !state ? true : undefined, page: input.page }).filter(([, v]) => v !== undefined),
      ) as SuggestionPayload,
      snapshot: holiday ? { name: holiday.name, rule: holiday.rule, kind: holiday.kind, status: holiday.status, legalBasis: holiday.legalBasis } : null,
      message: input.message,
      sourceUrl: input.sourceUrl ?? '',
      contributorName: input.contributorName ?? null,
      contributorLink: input.contributorLink ?? null,
      contributorEmail: input.contributorEmail ?? null,
      ipHash,
    });

  const to = adminEmail();
  if (to) {
    const where = placeLabel({ state, city }) + (input.placeText ? ` (${input.placeText})` : '');
    const lines = [
      `${SUGGESTION_TYPE_LABEL[input.type]} — ${holiday?.name ?? input.proposal.name ?? 'sem nome'} · ${where}`,
      [
        input.proposal.name && `Nome: ${input.proposal.name}`,
        input.proposal.rule && `Data: ${describeRule(input.proposal.rule)}`,
        input.proposal.kind && `Tipo: ${input.proposal.kind}`,
        input.message && `Mensagem: ${input.message}`,
        input.sourceUrl && `Fonte: ${input.sourceUrl}`,
        input.contributorName && `Enviado por: ${input.contributorName}`,
      ]
        .filter(Boolean)
        .join('\n'),
    ];
    const site = ctx.site ?? new URL(ctx.url.origin);
    await sendMail({
      to,
      subject: `Nova sugestão: ${SUGGESTION_TYPE_LABEL[input.type].toLowerCase()} em ${where}`,
      text: lines.join('\n\n'),
      link: { href: new URL(`/admin/sugestoes/${id}/`, site).href, label: 'Revisar no painel' },
    });
  }

  return reply(201, { ok: true, id });
};
