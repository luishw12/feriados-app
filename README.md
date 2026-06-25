# 🇧🇷 Feriados Brasil

Calendário interativo com todos os feriados do Brasil — nacionais, estaduais e municipais.

**Versão atual:** `1.0.0-beta` · **[Novidades](/changelog/)** · **[→ Acesse o site](https://feriados.luishw.com.br)** · **[→ Repositório](https://github.com/luishw12/feriados-app)**

## Funcionalidades

- Calendário anual com todos os feriados marcados
- Detecção automática de localização (com sua permissão)
- Feriados nacionais, estaduais e municipais
- Contador regressivo para o próximo feriado
- Dark e Light mode
- Site ultra rápido — 100% estático
- Formulário para sugerir feriados, reportar erros ou enriquecer artigos (sem precisar de GitHub)

## Tech Stack

Astro · React · Tailwind CSS · TypeScript · Vercel

## Variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```env
PUBLIC_SITE_URL=https://feriados.luishw.com.br
PUBLIC_AUTHOR_NAME=Luís Henrique Wendt
PUBLIC_LINKEDIN_URL=https://linkedin.com/in/luishw
PUBLIC_GITHUB_URL=https://github.com/luishw12/feriados-app
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Para analytics em produção:

1. Habilite **Vercel Analytics** no dashboard do projeto Vercel
2. Crie uma propriedade **Google Analytics 4** e defina `PUBLIC_GA_MEASUREMENT_ID` nas variáveis de ambiente da Vercel

Para o **formulário de contribuição** (criação automática de issues no GitHub):

1. Crie um [Fine-grained PAT](https://github.com/settings/tokens?type=beta) com permissão **Issues: Read and Write** **somente neste repositório**
2. Na Vercel, adicione `GITHUB_TOKEN` e `GITHUB_REPO` (ex.: `owner/feriados-app`) nas variáveis de ambiente — **nunca** no código nem com prefixo `PUBLIC_`
3. Crie a label `contribution` no repositório GitHub (labels `data` e `content` já são usadas pelos templates)

### Segurança do token

- O `GITHUB_TOKEN` fica **exclusivamente** no servidor da Vercel (`api/contributions.ts`). O navegador do visitante **nunca** recebe, envia ou enxerga esse token.
- O repositório público pode conter o código da API, mas **não** o valor do token — configure-o apenas no painel da Vercel (ou em `.env` local, que está no `.gitignore`).
- Use um PAT **fine-grained** com escopo mínimo (apenas Issues neste repo). Não reutilize tokens pessoais com acesso amplo.
- A API valida a origem da requisição, ignora campos suspeitos no body e retorna apenas mensagens genéricas em caso de erro (sem vazar respostas da API do GitHub).

## Desenvolvimento

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Contribuir

Contribuições são bem-vindas!

### Pelo site (sem GitHub)

Use o botão **"Faltou algum feriado?"** no rodapé ou na página [Sobre](/sobre/#contribuir) para sugerir um feriado que esteja faltando. Nas páginas de cada feriado (`/feriado/...`), você também pode reportar informações incorretas ou enviar conteúdo para enriquecer o artigo.

Se quiser, informe seu nome e rede social — após aprovação, você pode ser creditado na página do feriado.

### Pelo GitHub (desenvolvedores)

Leia o guia completo em **[CONTRIBUTING.md](CONTRIBUTING.md)**.

Resumo rápido:

1. Faça fork do repositório
2. Crie uma branch (`feat/`, `fix/` ou `data/`)
3. Execute `npm run build` antes de abrir o PR
4. Para feriados: edite arquivos em `src/data/holidays/` e cite a fonte oficial

Para entender a arquitetura do projeto, consulte [STRUCTURE.md](STRUCTURE.md).

Para controle de versões e releases em produção, consulte [VERSIONING.md](VERSIONING.md). O histórico completo está em [CHANGELOG.md](CHANGELOG.md) e na página [/changelog/](https://feriados.luishw.com.br/changelog/).

## Autor

Feito por **Luís Henrique Wendt** · [LinkedIn](https://linkedin.com/in/luishw) · [GitHub](https://github.com/luishw12)

## Licença

[MIT](LICENSE)
