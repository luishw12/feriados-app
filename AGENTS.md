# AGENTS.md: instruções para agentes de IA

Leia este arquivo e o [README.md](README.md) antes de alterar o projeto.

## O que é

Site de feriados do Brasil (nacionais, estaduais e municipais dos 5.571 municípios). Objetivo: ser o **primeiro resultado** em buscas sobre feriados e a fonte citada por assistentes de IA. Prioridades: dados corretos, páginas muito leves, SEO gerado a partir dos dados e contribuição fácil.

## Arquitetura (resumo)

- **Astro 7 SSR** (`output: 'server'`) na Vercel. As páginas são cacheadas no CDN com `cachePage(Astro, tags)` (`src/lib/cache.ts`) e invalidadas por tag em `src/lib/server/moderation.ts`
- **Banco:** Drizzle + libSQL (Turso em produção, `.data/feriados.db` local). Schema em `src/lib/db/schema.ts`. O banco é a fonte da verdade; `data/seed/` é o export aberto e a origem do seed local
- **Datas:** `src/lib/holidays/rules.ts` (DSL `fixed:MM-DD`, `easter:±N`, `nth:MM:DOW:N`, `last:MM:DOW`) e `resolve.ts` (ocorrências, agrupamento, pontes, dias úteis)
- **Modelos de página:** `src/lib/pages.ts` monta dados, título, lead (resposta direta), FAQ e caminho canônico. O HTML (`src/components/*.astro`) e o Markdown para IA (`src/lib/seo/markdown.ts`) usam o mesmo modelo
- **Ilhas Preact** em `src/islands/`, só onde há interação real
- **Painel** em `src/pages/admin/`, protegido pelo middleware (`src/middleware.ts`)

## Regras

### Dados
- Nunca edite `data/seed/*.json` à mão para "corrigir um feriado": a correção vai pelo painel/banco. O seed é sobrescrito pelo export diário
- IDs de feriado: `kebab-case` sem acento, únicos, estáveis (viram URL). Feriados locais levam cidade/UF no ID (`corpus-christi-porto-alegre-rs`)
- Nunca grave datas calculadas: use regra + `validFrom`/`validTo` + `holiday_overrides`
- Status: `verified` só com fonte oficial conferida; `unverified` para dados importados/inferidos; `incomplete` quando não se sabe o nome

### Páginas e SEO
- Toda página pública chama `cachePage()` com as tags corretas (`national`, `uf:XX`, `city:IBGE`, `h:ID`). Se esquecer, a aprovação não atualiza a página
- Texto de SEO (title, description, lead, FAQ) vem de `src/lib/pages.ts`. Não duplique texto em `.astro`
- Canonical com barra final (`trailingSlash: 'always'`), `lang="pt-BR"`, JSON-LD via `src/lib/seo/jsonld.ts`
- Mudou uma URL? Adicione redirect 301 (tabela `redirects` ou `src/middleware.ts`)

### Código
- TypeScript `strictest`, sem `any`. Evite `as`, exceto em fronteiras de JSON
- Tailwind com os tokens semânticos (`bg-surface`, `text-muted`, `tone-*`). Nada de cores soltas; o tema escuro vem dos tokens
- Nada de biblioteca de animação ou de UI pesada. Ícones inline (`src/components/Icon.astro`)
- JS no cliente: só em `src/islands/` ou `<script is:inline>` curtos. Meta: menos de 20 KB gz por página
- Acessibilidade: HTML semântico, `aria-label` em botões só com ícone, contraste AA (Lighthouse a11y = 100)
- Validação de entrada com `astro/zod`. Toda escrita de dados passa por `src/lib/server/moderation.ts` (revisões e invalidação)

### Antes de concluir
```bash
npm run check && npm test && npm run build
npm run test:e2e   # fluxos principais
```

## Commits e releases

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). Releases seguem o [VERSIONING.md](VERSIONING.md): mudança visível no **código** exige bump em `package.json`, entrada no topo de `src/data/releases.json` e `npm run changelog:sync`. Alterações de **dados** pelo painel não exigem release.
