# Como contribuir

Obrigado por considerar contribuir com o **Feriados Brasil**! Este guia explica como configurar o ambiente, enviar mudanças e seguir os padrões do projeto.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [npm](https://www.npmjs.com/) (incluído com o Node.js)
- [Git](https://git-scm.com/)

## Configuração local

1. Faça um fork do repositório e clone o seu fork:

```bash
git clone git@github.com:SEU_USUARIO/feriados-app.git
cd feriados-app
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o `.env` conforme necessário. O arquivo `.env` **nunca** deve ser commitado.

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O site estará disponível em `http://localhost:4321`.

## Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Gera o site estático em `dist/` |
| `npm run preview` | Pré-visualiza o build de produção |

Antes de abrir um PR, execute `npm run build` e confirme que não há erros.

## Tipos de contribuição

- **Dados de feriados** — corrigir datas, nomes ou adicionar feriados estaduais/municipais em `src/data/holidays/`
- **Conteúdo de artigos** — enriquecer textos em `src/data/articles/`
- **Código** — melhorias de UI, componentes, performance ou correções de bugs
- **Documentação** — README, guias ou comentários em código complexo

## Contribuições pelo site (usuários)

Visitantes podem enviar sugestões pelo formulário integrado ao site, sem conta no GitHub:

| Tipo | Onde acessar | O que acontece |
|---|---|---|
| Sugerir feriado faltante | Rodapé ou `/sobre/#contribuir` | Cria issue com label `contribution` + `data` |
| Reportar erro | Página `/feriado/[id]/` | Cria issue com label `contribution` + `data` |
| Enriquecer artigo | Página `/feriado/[id]/` | Cria issue com label `contribution` + `content` |

### Fluxo de aprovação (mantenedor)

1. Revise a issue criada automaticamente no GitHub
2. Atualize os JSONs em `src/data/holidays/` e/ou `src/data/articles/` conforme necessário
3. Se o usuário autorizou crédito público, adicione o campo `contributors` no artigo:

```json
"contributors": [
  {
    "name": "Maria Silva",
    "socialLabel": "LinkedIn",
    "socialUrl": "https://linkedin.com/in/maria",
    "role": "correction"
  }
]
```

Valores de `role`: `suggestion`, `correction`, `enrichment`.

4. Feche a issue e faça deploy

A API serverless fica em `api/contributions.ts` e requer `GITHUB_TOKEN` e `GITHUB_REPO` nas variáveis de ambiente da Vercel.

## Fluxo de trabalho

1. Crie uma branch a partir de `main`:

```bash
git checkout -b feat/minha-mudanca
# ou: fix/, data/, docs/
```

2. Faça commits seguindo [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar countdown para próximo feriado
fix: corrigir cálculo da Páscoa para anos bissextos
data: adicionar feriados municipais do RS
docs: atualizar README com instruções de deploy
```

3. Envie a branch para o seu fork e abra um Pull Request para `main`.

## Como editar dados de feriados

Os feriados ficam em arquivos JSON em `src/data/holidays/`. Consulte [`src/data/schema.ts`](src/data/schema.ts) para os tipos TypeScript.

### Estrutura de pastas

```
src/data/holidays/
├── national.json
├── commemorative.json
├── states/
│   └── RS.json          # um arquivo por UF (MAIÚSCULO)
└── municipalities/
    └── RS/
        └── porto-alegre.json   # kebab-case, sem acentos
```

### Regras dos dados

| Campo | Regra |
|---|---|
| `id` | `kebab-case` sem acentos, único globalmente |
| `name` | Nome oficial do feriado |
| `type` | `national`, `state`, `municipal`, `optional`, `state_optional`, `commemorative` |
| `date` | Datas fixas no formato `MM-DD` (ex.: `"12-25"`) |
| `dateRule` | Datas móveis relativas à Páscoa (ex.: `"easter-47"` para Carnaval terça) |

### Datas móveis — referência rápida

| Feriado | `dateRule` |
|---|---|
| Carnaval (segunda) | `easter-48` |
| Carnaval (terça) | `easter-47` |
| Quarta de Cinzas | `easter-46` |
| Sexta-feira Santa | `easter-2` |
| Páscoa | `easter+0` |
| Corpus Christi | `easter+60` |

### Importante

- **Não importe JSON diretamente em componentes** — use as funções de [`src/lib/holidays.ts`](src/lib/holidays.ts)
- Inclua a **fonte oficial** na descrição do PR (lei municipal, decreto, site do governo, etc.)
- Para feriados municipais, verifique se a cidade já existe em `src/data/holidays/municipalities/[UF]/`

## Padrões de código

Leia também:

- [`STRUCTURE.md`](STRUCTURE.md) — arquitetura e responsabilidade de cada pasta
- [`.cursorrules`](.cursorrules) — convenções de TypeScript, Astro, React e Tailwind

Resumo das regras principais:

- TypeScript com `strict: true` — sem `any`
- Componentes Astro: máx. 150 linhas; React islands: máx. 200 linhas
- Imagens sempre com `<Image />` do Astro — nunca `<img>` raw
- Tailwind para estilos — sem `style={}` inline
- Dark mode via classe `dark` no `<html>`
- Dados 100% estáticos — sem `fetch()` em runtime para feriados

## Checklist do Pull Request

- [ ] `npm run build` executa sem erros
- [ ] Nenhum arquivo `.env` ou `dist/` foi commitado
- [ ] Commits seguem Conventional Commits
- [ ] Para mudanças em dados: fonte oficial citada na descrição do PR
- [ ] Para mudanças de UI: screenshot anexado (se aplicável)
- [ ] Descrição clara do que mudou e por quê

## Reportar problemas

Use as [issues do GitHub](https://github.com/luishw12/feriados-app/issues). Há templates para bugs e para correção de dados de feriados.

## Dúvidas

Abra uma issue com a tag apropriada ou comente em um PR existente. Toda contribuição é bem-vinda!
