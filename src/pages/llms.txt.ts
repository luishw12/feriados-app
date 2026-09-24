import type { APIRoute } from 'astro';
import { cachePage } from '@/lib/cache';
import { getNationalHolidays, getStates } from '@/lib/data';
import { resolveYear } from '@/lib/holidays/resolve';
import { formatShort } from '@/lib/holidays/rules';
import { toDef } from '@/lib/data';
import { SITE_NAME, SITE_TAGLINE, currentYear, paths } from '@/lib/site';

/** https://llmstxt.org — mapa do site para modelos de linguagem. */
export const GET: APIRoute = async (ctx) => {
  const site = ctx.site ?? new URL(ctx.url.origin);
  const u = (p: string) => new URL(p, site).href;
  const year = currentYear();
  const [states, national] = await Promise.all([getStates(), getNationalHolidays()]);
  const list = resolveYear(national.map(toDef), year).filter((o) => o.kind === 'feriado');
  cachePage(ctx, ['national', 'llms'], { maxAge: 60 * 60 * 24 });

  const body = `# ${SITE_NAME}

> ${SITE_TAGLINE}. Base aberta e mantida pela comunidade com os feriados dos 27 estados e dos 5.571 municípios, incluindo datas móveis (Carnaval, Sexta-feira Santa, Corpus Christi), pontos facultativos, emendas e base legal.

Toda página tem uma versão em Markdown: acrescente \`.md\` ao caminho (ex.: ${u('/sp/campinas.md')}). Os dados também estão disponíveis em JSON pela API gratuita.

Feriados nacionais obrigatórios em ${year}: ${list.map((o) => `${o.name} (${formatShort(o.date)})`).join('; ')}.

## Páginas principais

- [Feriados ${year} no Brasil](${u(paths.year(year) )}): calendário nacional com feriados, pontos facultativos e datas comemorativas
- [Feriados ${year + 1} no Brasil](${u(paths.year(year + 1))})
- [Feriados prolongados ${year}](${u(paths.bridges(year))}): quais feriados permitem emenda
- [Próximo feriado](${u(paths.next())})
- [Calculadora de dias úteis](${u(paths.businessDays())})

## Feriados por estado

${states.map((s) => `- [Feriados ${s.name} (${s.uf})](${u(paths.state(s.uf))}): feriados estaduais e lista de municípios`).join('\n')}

## Feriados por cidade

Padrão de URL: ${u('/{uf}/{cidade}/')} — ex.: ${u('/sp/sao-paulo/')}, ${u('/rj/rio-de-janeiro/')}, ${u('/rs/porto-alegre/')}. Anos específicos: ${u('/sp/campinas/2027/')}.

## Feriados individuais

Padrão: ${u('/feriado/{id}/')} e ${u('/feriado/{id}/{ano}/')} — ex.: ${u('/feriado/carnaval/2027/')}, ${u('/feriado/corpus-christi/')}.

## Dados

- [API e dados abertos](${u(paths.api())}): endpoints JSON sem cadastro (ex.: ${u(`/api/v1/feriados/${year}/?uf=SP&ibge=3509502`)})
- [Texto completo para LLMs](${u('/llms-full.txt')})

## Opcional

- [Como contribuir](${u(paths.contribute())})
- [Sobre o projeto](${u(paths.about())})
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
