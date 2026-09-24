import type { APIRoute } from 'astro';
import { asc, eq, or } from 'drizzle-orm';
import { cachePage } from '@/lib/cache';
import { getDb, schema } from '@/lib/db/client';
import { getStates, toDef } from '@/lib/data';
import { resolveYear } from '@/lib/holidays/resolve';
import { describeRule, formatShort, weekdayName } from '@/lib/holidays/rules';
import { SITE_NAME, STATUS_LABEL, currentYear, paths, typeLabel } from '@/lib/site';

/** Conteúdo nacional e estadual completo em texto, para ingestão por LLMs. */
export const GET: APIRoute = async (ctx) => {
  const site = ctx.site ?? new URL(ctx.url.origin);
  const year = currentYear();
  const [rows, states] = await Promise.all([
    getDb()
      .select()
      .from(schema.holidays)
      .where(or(eq(schema.holidays.scope, 'national'), eq(schema.holidays.scope, 'state')))
      .orderBy(asc(schema.holidays.uf), asc(schema.holidays.id)),
    getStates(),
  ]);
  cachePage(ctx, ['national', 'llms'], { maxAge: 60 * 60 * 24 });
  const national = rows.filter((r) => r.scope === 'national');
  const section = (y: number) =>
    resolveYear(national.map(toDef), y)
      .map((o) => `- ${formatShort(o.date)} (${weekdayName(o.date)}): ${o.name} — ${typeLabel(o.scope, o.kind)}`)
      .join('\n');

  const holidayText = rows
    .map((h) => {
      const state = states.find((s) => s.uf === h.uf);
      return [
        `### ${h.name}${state ? ` (${state.name})` : ''}`,
        `URL: ${new URL(paths.holiday(h.id), site).href}`,
        `Tipo: ${typeLabel(h.scope, h.kind)} · Regra: ${describeRule(h.rule)} · Status: ${STATUS_LABEL[h.status]}`,
        h.legalBasis ? `Base legal: ${h.legalBasis}` : '',
        h.body || h.summary,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const body = `# ${SITE_NAME} — conteúdo completo

Fonte: ${site.href}

## Feriados nacionais ${year}

${section(year)}

## Feriados nacionais ${year + 1}

${section(year + 1)}

## Todos os feriados nacionais e estaduais

${holidayText}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
