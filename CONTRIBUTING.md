# Como contribuir

Obrigado por ajudar o **Feriados Brasil**!

## Dados de feriados → pelo site

Encontrou um feriado errado, faltando ou que não existe? **Não abra PR.** Use o botão “Sugerir correção” na página do feriado, ou “Sugerir feriado” na página da cidade. A sugestão vai para a fila de moderação e, quando aprovada, entra no ar na hora, com crédito para você se quiser.

Uma fonte oficial (lei municipal, decreto, site da prefeitura) acelera muito a aprovação.

## Código → pelo GitHub

### Ambiente

Requer Node.js 22+.

```bash
git clone git@github.com:SEU_USUARIO/feriados-app.git
cd feriados-app
npm install
npm run dev
```

O `npm run dev` cria um banco SQLite local (`.data/feriados.db`) a partir de `data/seed/`. Não precisa de nenhuma chave. Para testar o painel, acesse `/admin/` e clique em “Entrar (modo desenvolvimento)”.

### Antes de abrir o PR

```bash
npm run check      # tipos
npm test           # testes unitários
npm run test:e2e   # testes de ponta a ponta (opcional localmente; roda no CI)
npm run build
```

- Commits em [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `docs:`…)
- Mudou o schema (`src/lib/db/schema.ts`)? Gere a migração com `npm run db:generate` e commite a pasta `drizzle/`
- Mudança de UI: anexe screenshots no claro, no escuro e no mobile
- Não commite `.env`, `.data/` nem `dist/`
- Não faça bump de versão: o mantenedor faz o release (ver [VERSIONING.md](VERSIONING.md))

### Princípios do projeto

- **Leve:** HTML renderizado no servidor e JavaScript só em ilhas pequenas (Preact). Nada de bibliotecas de animação
- **Acessível:** HTML semântico, contraste AA, tudo navegável por teclado
- **Dados → páginas:** títulos, textos, FAQ, JSON-LD e Markdown saem dos modelos em `src/lib/pages.ts`. Nunca escreva texto de SEO "na mão" numa página
- **Datas por regra:** nunca grave uma data calculada. Use a DSL de `src/lib/holidays/rules.ts`

Veja também [AGENTS.md](AGENTS.md), que traz as convenções detalhadas de código.
