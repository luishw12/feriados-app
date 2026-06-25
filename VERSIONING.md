# Controle de versões — Feriados Brasil

Este documento define como versionar, documentar e publicar releases do projeto. Leia-o integralmente antes de qualquer deploy em produção.

## Princípios

- **SemVer 2.0.0** — formato `MAJOR.MINOR.PATCH` com suporte a prerelease (`beta`, `rc`).
- **Fontes únicas** — evitar duplicação manual:
  - `package.json` → `version` (número exibido no site)
  - `src/data/releases.json` → histórico estruturado do changelog (SSOT do conteúdo)
  - `CHANGELOG.md` → espelho legível gerado por script (não editar manualmente)
- **Releases atômicos** — cada deploy em produção com mudança visível ao usuário gera um único commit de release com tag Git.

## Canais de release

| Canal | Formato | Quando usar |
|---|---|---|
| Beta | `x.y.z-beta` ou `x.y.z-beta.N` | Funcionalidades em validação (estado atual do projeto) |
| Release candidate | `x.y.z-rc.N` | Candidato a versão estável, sem features novas |
| Estável | `x.y.z` | Produção madura, sem sufixo de prerelease |

Exemplos de sequência até a primeira estável:

```
1.0.0-beta → 1.0.0-beta.1 → 1.0.0-rc.1 → 1.0.0
```

## Quando subir cada segmento

| Tipo de mudança | Bump | Exemplo |
|---|---|---|
| Correção de bug, typo, correção pontual de dado | **PATCH** | `1.0.0-beta` → `1.0.1-beta` |
| Nova funcionalidade, nova página, lote relevante de dados | **MINOR** | `1.0.0-beta` → `1.1.0-beta` |
| Breaking change (URLs, schema de dados, UX incompatível) | **MAJOR** | `1.x` → `2.0.0-beta` |

### O que **não** exige release

- Refactors internos sem impacto ao usuário
- Ajustes de estilo ou documentação interna
- Commits de desenvolvimento que ainda não vão para produção

### O que **sempre** exige release

- Qualquer mudança visível ao visitante do site em produção
- Correções de dados de feriados publicadas
- Novas páginas, componentes ou fluxos de UI

## Estrutura do changelog

O arquivo `src/data/releases.json` segue as categorias do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/):

| Chave | Uso |
|---|---|
| `added` | Funcionalidades novas |
| `changed` | Mudanças em funcionalidades existentes |
| `deprecated` | Funcionalidades que serão removidas |
| `removed` | Funcionalidades removidas |
| `fixed` | Correções de bugs |
| `security` | Correções de vulnerabilidades |

Cada release deve ter:

- `version` — igual ao `package.json`
- `date` — data da release no formato `YYYY-MM-DD`
- `status` — `beta`, `rc` ou `stable`
- `summary` — uma frase descrevendo a release
- `sections` — listas por categoria (arrays vazios são permitidos)

**Regra:** novas entradas sempre no **topo** do array `releases`. Nunca reescrever releases antigas.

## Fluxo obrigatório para deploy em produção

Execute nesta ordem:

```bash
# 1. Atualizar package.json → "version"
# 2. Adicionar entrada no topo de src/data/releases.json
# 3. Sincronizar CHANGELOG.md
npm run changelog:sync

# 4. Validar consistência e build
npm run release:check
npm run build

# 5. Commit e tag
git add package.json src/data/releases.json CHANGELOG.md
git commit -m "chore(release): v1.0.0-beta"
git tag v1.0.0-beta
```

### Formato do commit de release

```
chore(release): v{versão}
```

Corpo opcional com bullets resumindo as mudanças principais.

### Tags Git

- Formato: `v{versão}` (ex.: `v1.0.0-beta`, `v1.1.0`)
- Uma tag por release publicada em produção
- Push da tag: `git push origin v{versão}` (quando aplicável)

## Commits de desenvolvimento (sem release)

Use [Conventional Commits](https://www.conventionalcommits.org/) normalmente:

```
feat: adicionar filtro por categoria no calendário
fix: corrigir countdown em feriados móveis
data: adicionar feriados municipais de Curitiba
docs: atualizar guia de contribuição
```

Não inclua bump de versão nesses commits — o release commit consolida tudo.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run changelog:sync` | Gera `CHANGELOG.md` a partir de `releases.json` |
| `npm run release:check` | Valida se `package.json.version` = versão mais recente em `releases.json` |

## Checklist pré-deploy

- [ ] Classifiquei as mudanças (PATCH / MINOR / MAJOR)
- [ ] Atualizei `package.json` → `version`
- [ ] Adicionei entrada no topo de `src/data/releases.json`
- [ ] Executei `npm run changelog:sync`
- [ ] Executei `npm run release:check` sem erros
- [ ] Executei `npm run build` sem erros
- [ ] Commit no formato `chore(release): v{versão}`
- [ ] Tag Git `v{versão}` criada

## Página pública

O histórico de versões é exibido em `/changelog/` no site. A versão atual aparece:

- No **rodapé** das páginas com layout padrão
- Na **barra fixa** (canto inferior direito) da home/calendário

## Contribuidores externos

Contribuidores via Pull Request **não** fazem release. O mantenedor consolida as mudanças, executa o fluxo de release e cria a tag antes do deploy.

## Referências

- [VERSIONING.md](VERSIONING.md) — este documento
- [CHANGELOG.md](CHANGELOG.md) — histórico gerado
- [AGENTS.md](AGENTS.md) — regras para agentes de IA
- [CONTRIBUTING.md](CONTRIBUTING.md) — guia de contribuição
