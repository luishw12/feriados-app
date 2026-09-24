# Feriados Brasil

Feriados nacionais, estaduais e municipais dos **5.571 municípios** brasileiros, em um site rápido, aberto e mantido pela comunidade.

**Site:** https://feriados.luishw.com.br · **API:** https://feriados.luishw.com.br/api/

- Calendário por ano, estado e cidade, com dia da semana, emendas e base legal
- Qualquer pessoa sugere correções sem cadastro; o mantenedor aprova no painel e o site atualiza **na hora**
- SEO e leitura por IA gerados automaticamente a partir dos dados: JSON-LD, sitemap, `llms.txt` e versão Markdown de cada página (`/sp/campinas.md`)
- API JSON gratuita, calendário `.ics` assinável e widget para incorporar
- Dados abertos (MIT), exportados diariamente para [`data/seed/`](data/seed)

## Stack

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) (SSR) na Vercel, com cache no CDN por tags |
| Interatividade | Ilhas [Preact](https://preactjs.com) (busca, sugestão, calculadora) |
| Estilo | Tailwind CSS 4, fonte do sistema, tema claro/escuro |
| Dados | [Turso](https://turso.tech) (libSQL/SQLite) + [Drizzle ORM](https://orm.drizzle.team) |
| Moderação | Login GitHub OAuth, Cloudflare Turnstile, e-mail via Resend |
| Testes | Vitest (motor de datas) + Playwright (fluxos) |

## Rodando localmente

Requer Node.js 22+. Nenhuma conta ou chave é necessária para desenvolver.

```bash
npm install
npm run dev        # cria .data/feriados.db a partir de data/seed/ e sobe em http://localhost:4321
```

- Painel: http://localhost:4321/admin/ → “Entrar (modo desenvolvimento)”
- Sem `RESEND_API_KEY`, e-mails são impressos no console; sem Turnstile, o anti-robô é ignorado

| Comando | O que faz |
|---|---|
| `npm run dev` | Prepara o banco local e inicia o servidor |
| `npm run check` | TypeScript/Astro (`astro check`) |
| `npm test` | Testes unitários (Páscoa, regras de data, pontes, dias úteis) |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright) |
| `npm run build` | Build de produção (adapter Vercel) |
| `npm run db:generate` | Gera migração após mudar `src/lib/db/schema.ts` |
| `npm run db:seed -- --force` | Recarrega o banco local a partir do seed |
| `npm run db:export` | Exporta o banco para `data/seed/` |

## Como funciona

```
visitante ── sugere ──▶ POST /api/suggestions ──▶ tabela suggestions ──▶ e-mail p/ mantenedor
                                                          │
mantenedor ── /admin/sugestoes/{id} ── aprova ────────────┘
      │
      ├─▶ grava holidays + revisions (histórico e créditos)
      ├─▶ invalida no CDN só as tags afetadas (h:{id}, city:{ibge}, uf:{UF} ou national)
      └─▶ avisa o IndexNow (Bing/Copilot/ChatGPT Search) e o contribuidor
```

Cada página é renderizada no servidor e guardada no CDN da Vercel com tags. Por isso é tão rápida quanto um site estático e, mesmo assim, atualiza em segundos após uma aprovação, sem rebuild.

### Datas

Cada feriado tem uma **regra** em vez de uma data fixa no código (`src/lib/holidays/rules.ts`):

| Regra | Exemplo |
|---|---|
| `fixed:MM-DD` | `fixed:12-25` — Natal |
| `easter:±N` | `easter:-47` — Carnaval, `easter:+60` — Corpus Christi |
| `nth:MM:DOW:N` | `nth:05:0:2` — Dia das Mães (2º domingo de maio) |
| `last:MM:DOW` | último dia da semana do mês |

Validade por ano (`validFrom`/`validTo`) e exceções pontuais (`holiday_overrides`, ex.: feriado transferido por decreto) cobrem mudanças de lei.

### Estrutura

```
src/
  pages/            rotas públicas, /admin, /api, .md, .ics, sitemap, llms.txt
  components/       componentes .astro (listas, página de feriado, layout)
  islands/          componentes Preact (busca, sugestão, calculadora)
  lib/
    db/             schema Drizzle e cliente
    holidays/       motor de datas, pontes e dias úteis
    seo/            JSON-LD, Markdown, sitemap
    server/         auth, moderação, e-mail, anti-spam
    pages.ts        modelos de página (dados + textos + FAQ)
data/seed/          dataset aberto (fonte do seed local)
drizzle/            migrações do banco
tests/              unit (Vitest) e e2e (Playwright)
```

## Deploy (Vercel)

1. **Banco:** crie um banco no [Turso](https://turso.tech) (`turso db create feriados`) e gere um token (`turso db tokens create feriados`)
2. **Login do painel:** crie um [GitHub OAuth App](https://github.com/settings/developers) com callback `https://SEU-DOMINIO/admin/auth/callback/`
3. **Anti-spam:** crie um widget no [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) para o domínio
4. **E-mail:** crie uma chave no [Resend](https://resend.com) e verifique o domínio do remetente
5. Configure as variáveis na Vercel (veja [`.env.example`](.env.example)): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_LOGINS`, `SESSION_SECRET`, `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `EMAIL_FROM`, `INDEXNOW_KEY`, `PUBLIC_SITE_URL` e, opcionalmente, `PUBLIC_GA_MEASUREMENT_ID` (Google Analytics 4, carregado só após consentimento)
6. Faça o deploy. O build aplica as migrações e, se o banco estiver vazio, carrega o seed automaticamente

Sem `TURSO_DATABASE_URL` (ex.: previews), o site usa um SQLite embutido **somente leitura**: tudo funciona, exceto enviar sugestões.

**Dataset diário:** para o workflow `export-data.yml` rodar, adicione os segredos `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no GitHub e a variável de repositório `EXPORT_ENABLED=true`.

## Contribuindo

- **Dados** (feriado errado ou faltando): use o botão “Sugerir correção” no site. É mais rápido e passa pela moderação
- **Código:** veja [CONTRIBUTING.md](CONTRIBUTING.md)

## Créditos e licença

Código e dados sob licença [MIT](LICENSE). Base inicial de feriados estaduais e municipais: [joaopbini/feriados-brasil](https://github.com/joaopbini/feriados-brasil) (MIT). Coordenadas dos municípios: [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros) (MIT).

Feito por [Luís Henrique Wendt](https://www.linkedin.com/in/luishw).
