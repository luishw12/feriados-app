# 🇧🇷 Feriados Brasil

Calendário interativo com todos os feriados do Brasil — nacionais, estaduais e municipais.

**[→ Acesse o site](https://feriados-brasil.vercel.app)** · **[→ Repositório](https://github.com/luishw12/feriados-app)**

## Funcionalidades

- Calendário anual com todos os feriados marcados
- Detecção automática de localização (com sua permissão)
- Feriados nacionais, estaduais e municipais
- Contador regressivo para o próximo feriado
- Dark e Light mode
- Site ultra rápido — 100% estático

## Tech Stack

Astro · React · Tailwind CSS · TypeScript · Vercel

## Variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```env
PUBLIC_SITE_URL=https://feriados-brasil.vercel.app
PUBLIC_AUTHOR_NAME=Luís Henrique Wendt
PUBLIC_LINKEDIN_URL=https://linkedin.com/in/luishw
PUBLIC_GITHUB_URL=https://github.com/luishw12/feriados-app
```

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

Contribuições são bem-vindas! Leia o guia completo em **[CONTRIBUTING.md](CONTRIBUTING.md)**.

Resumo rápido:

1. Faça fork do repositório
2. Crie uma branch (`feat/`, `fix/` ou `data/`)
3. Execute `npm run build` antes de abrir o PR
4. Para feriados: edite arquivos em `src/data/holidays/` e cite a fonte oficial

Para entender a arquitetura do projeto, consulte [STRUCTURE.md](STRUCTURE.md).

## Autor

Feito por **Luís Henrique Wendt** · [LinkedIn](https://linkedin.com/in/luishw) · [GitHub](https://github.com/luishw12)

## Licença

[MIT](LICENSE)
