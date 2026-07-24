# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

> **Não edite este arquivo manualmente.** Ele é gerado a partir de
> `src/data/releases.json` via `npm run changelog:sync`.

## [1.2.0-beta] - 2026-07-24

Redesign completo da interface com Tailwind CSS v4, calendário reformulado e nova navegação mobile.

### Adicionado

- Migração para Tailwind CSS v4 com tema unificado e variáveis CSS
- Componentes shadcn/ui para formulários, modais e controles interativos
- Navegação mobile com menu animado (StaggeredMenu)
- Faixa de meses (MonthStrip) para navegação rápida no calendário
- Contador regressivo integrado ao painel do calendário
- Efeitos visuais de fundo: starfield, border glow e spotlight
- Hub de guias redesenhado com snapshot do ano e índice visual
- Página Sobre reformulada com cards animados e links do autor
- Ações de contribuição direto nos dias do calendário
- Dica de precisão ao selecionar localização

### Alterado

- Calendário completamente redesenhado com nova hierarquia visual
- Header e navegação principal modernizados com pill nav
- Formulário de contribuição reformulado com stepper e campos agrupados
- Filtros de categoria e resumo anual com novo visual
- Gate de permissão de localização com fluxo mais claro
- SEO e schema dos guias atualizados para o novo hub

### Removido

- Contador flutuante substituído pelo contador integrado ao calendário
- Card de sugestão de localização em favor do gate unificado
- tailwind.config.mjs substituído pela configuração inline do Tailwind v4

## [1.1.0-beta] - 2026-07-23

Formulário de contribuição com campos completos, upload de banner e abertura automática de pull request no GitHub.

### Adicionado

- Formulário estruturado com todos os campos do feriado e do artigo
- Upload de imagem de banner (arquivo ou URL) nas contribuições
- Abertura automática de pull request no GitHub para revisão do mantenedor
- Pré-preenchimento dos dados ao corrigir ou enriquecer feriados existentes

### Alterado

- Contribuições passam a gerar pull requests em vez de issues no GitHub
- Política de privacidade e textos do site atualizados para o novo fluxo

## [1.0.1-beta] - 2026-06-25

Correção do piscar da localização na navbar ao navegar entre páginas.

### Corrigido

- Localização salva deixa de piscar para "Brasil" ao trocar de rota
- View Transitions com persistência do seletor de localização no header
- Leitura síncrona da localização salva no carregamento da página

## [1.0.0-beta] - 2026-06-25

Primeira versão pública em beta do calendário completo de feriados brasileiros.

### Adicionado

- Calendário interativo com feriados nacionais, estaduais e municipais em mais de 5.500 cidades
- Header unificado com seleção de localização em todas as páginas
- Navegação entre feriados filtrada pela localização do usuário
- Detecção de localização com sugestão discreta e seleção manual de estado e município
- Contador regressivo flutuante para o próximo feriado
- Páginas por estado e por cidade com calendário contextual
- Artigos educativos por feriado com história, curiosidades e fontes
- Guias de feriados (dias úteis, facultativos, emendas e datas móveis)
- Busca de feriados e filtros por categoria
- Dark mode e light mode com preferência persistida
- Formulário de contribuição para sugerir feriados, reportar erros e enriquecer artigos
- Política de privacidade e consentimento de cookies (LGPD)
- Página de novidades (/changelog/) com histórico de versões
- Índices para assistentes de IA em /llms.txt e /llms-full.txt
