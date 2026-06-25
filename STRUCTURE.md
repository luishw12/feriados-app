# STRUCTURE.md — Estrutura do Projeto

> Referência completa de pastas, arquivos e suas responsabilidades.
> Consulte este arquivo sempre que for criar um novo arquivo para garantir que ele vai no lugar certo.

---

## Árvore de Pastas

```
feriados-brasil/
│
├── public/                          # Arquivos servidos diretamente (sem processamento)
│   ├── favicon.svg                  # Favicon SVG (usar verde emerald #10b981 como cor)
│   ├── robots.txt                   # Regras para crawlers
│   └── og/
│       └── default.png              # OG image padrão (1200x630px)
│
├── src/
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                      # Componentes base reutilizáveis (Astro — sem JS)
│   │   │   ├── Badge.astro          # Badge colorida por tipo de feriado
│   │   │   ├── Button.astro         # Botão base com variantes
│   │   │   └── Card.astro           # Container card base
│   │   │
│   │   ├── holiday/                 # Componentes específicos de feriados (Astro)
│   │   │   ├── HolidayCard.astro    # Card de um único feriado
│   │   │   ├── HolidayList.astro    # Lista de feriados (recebe array)
│   │   │   └── HolidayMonth.astro   # Grade de dias de um mês com feriados marcados
│   │   │
│   │   ├── interactive/             # Componentes React (islands — com JS no cliente)
│   │   │   ├── HolidayCalendar.tsx  # Calendário principal anual interativo
│   │   │   ├── Countdown.tsx        # Contador regressivo DD:HH:MM:SS
│   │   │   ├── LocationPicker.tsx   # Geolocation API + seletor manual estado/cidade
│   │   │   ├── ThemeToggle.tsx      # Botão Dark/Light com persistência em localStorage
│   │   │   └── YearSelector.tsx     # Navegar entre anos (← 2024 · 2025 · 2026 →)
│   │   │
│   │   ├── layout/                  # Componentes estruturais (Astro)
│   │   │   ├── Header.astro         # Cabeçalho: logo + nav + ThemeToggle
│   │   │   ├── Footer.astro         # Rodapé: créditos + links + GitHub
│   │   │   ├── Nav.astro            # Links de navegação
│   │   │   └── LinkedInCTA.astro    # Banner fixo canto inferior direito → LinkedIn
│   │   │
│   │   └── SEO.astro                # Meta tags: title, description, OG, Twitter, canonical
│   │
│   ├── data/
│   │   ├── schema.ts                # ⭐ CRIAR PRIMEIRO — Todos os tipos TypeScript
│   │   ├── states.json              # Lista dos 27 estados com UF, nome, slug, capital, região
│   │   └── holidays/
│   │       ├── national.json        # Feriados nacionais + facultativos nacionais
│   │       │
│   │       ├── states/              # Um arquivo JSON por UF
│   │       │   ├── AC.json          # Acre
│   │       │   ├── AL.json          # Alagoas
│   │       │   ├── AM.json          # Amazonas
│   │       │   ├── AP.json          # Amapá
│   │       │   ├── BA.json          # Bahia
│   │       │   ├── CE.json          # Ceará
│   │       │   ├── DF.json          # Distrito Federal
│   │       │   ├── ES.json          # Espírito Santo
│   │       │   ├── GO.json          # Goiás
│   │       │   ├── MA.json          # Maranhão
│   │       │   ├── MG.json          # Minas Gerais
│   │       │   ├── MS.json          # Mato Grosso do Sul
│   │       │   ├── MT.json          # Mato Grosso
│   │       │   ├── PA.json          # Pará
│   │       │   ├── PB.json          # Paraíba
│   │       │   ├── PE.json          # Pernambuco
│   │       │   ├── PI.json          # Piauí
│   │       │   ├── PR.json          # Paraná
│   │       │   ├── RJ.json          # Rio de Janeiro
│   │       │   ├── RN.json          # Rio Grande do Norte
│   │       │   ├── RO.json          # Rondônia
│   │       │   ├── RR.json          # Roraima
│   │       │   ├── RS.json          # Rio Grande do Sul
│   │       │   ├── SC.json          # Santa Catarina
│   │       │   ├── SE.json          # Sergipe
│   │       │   ├── SP.json          # São Paulo
│   │       │   └── TO.json          # Tocantins
│   │       │
│   │       └── municipalities/      # Um diretório por UF, um JSON por cidade
│   │           ├── AC/
│   │           │   └── rio-branco.json
│   │           ├── AL/
│   │           │   └── maceio.json
│   │           ├── AM/
│   │           │   └── manaus.json
│   │           ├── AP/
│   │           │   └── macapa.json
│   │           ├── BA/
│   │           │   ├── salvador.json
│   │           │   └── feira-de-santana.json
│   │           ├── CE/
│   │           │   ├── fortaleza.json
│   │           │   └── caucaia.json
│   │           ├── DF/
│   │           │   └── brasilia.json
│   │           ├── ES/
│   │           │   ├── vitoria.json
│   │           │   └── vila-velha.json
│   │           ├── GO/
│   │           │   └── goiania.json
│   │           ├── MA/
│   │           │   └── sao-luis.json
│   │           ├── MG/
│   │           │   ├── belo-horizonte.json
│   │           │   ├── uberlandia.json
│   │           │   └── contagem.json
│   │           ├── MS/
│   │           │   └── campo-grande.json
│   │           ├── MT/
│   │           │   └── cuiaba.json
│   │           ├── PA/
│   │           │   └── belem.json
│   │           ├── PB/
│   │           │   └── joao-pessoa.json
│   │           ├── PE/
│   │           │   ├── recife.json
│   │           │   └── jaboatao-dos-guararapes.json
│   │           ├── PI/
│   │           │   └── teresina.json
│   │           ├── PR/
│   │           │   ├── curitiba.json
│   │           │   └── londrina.json
│   │           ├── RJ/
│   │           │   ├── rio-de-janeiro.json
│   │           │   └── sao-goncalo.json
│   │           ├── RN/
│   │           │   └── natal.json
│   │           ├── RO/
│   │           │   └── porto-velho.json
│   │           ├── RR/
│   │           │   └── boa-vista.json
│   │           ├── RS/
│   │           │   ├── porto-alegre.json
│   │           │   ├── caxias-do-sul.json
│   │           │   ├── canoas.json
│   │           │   ├── pelotas.json
│   │           │   ├── santa-maria.json
│   │           │   └── lajeado.json
│   │           ├── SC/
│   │           │   ├── florianopolis.json
│   │           │   └── joinville.json
│   │           ├── SE/
│   │           │   └── aracaju.json
│   │           ├── SP/
│   │           │   ├── sao-paulo.json
│   │           │   ├── guarulhos.json
│   │           │   ├── campinas.json
│   │           │   └── sao-bernardo-do-campo.json
│   │           └── TO/
│   │               └── palmas.json
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro         # Layout raiz: html, head (SEO), header, slot, footer, CTA
│   │
│   ├── lib/                         # Lógica pura — sem componentes, sem side effects
│   │   ├── dates.ts                 # Algoritmo de Páscoa + resolução de datas móveis
│   │   ├── holidays.ts              # Funções de acesso e composição dos dados JSON
│   │   ├── geolocation.ts           # Detectar estado por coordenadas (Nominatim API)
│   │   └── seo.ts                   # Funções para gerar title, description, canonical por página
│   │
│   ├── pages/
│   │   ├── index.astro              # / → Home com calendário completo
│   │   ├── sobre.astro              # /sobre → Sobre o autor + CTA LinkedIn
│   │   └── [estado]/
│   │       ├── index.astro          # /[estado] → Feriados do estado
│   │       └── [cidade].astro       # /[estado]/[cidade] → Feriados do município
│   │
│   └── styles/
│       └── global.css               # Reset CSS, variáveis de tema, fontes
│
├── .cursorrules                     # Regras de IA para o Cursor
├── .gitignore
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
├── vercel.json
├── AGENTS.md                        # Este arquivo — instruções para o agente
├── PLAN.md                          # Plano completo do projeto
├── STRUCTURE.md                     # Estrutura de pastas
└── README.md                        # Documentação pública do GitHub
```

---

## Responsabilidades por Camada

### `src/data/` — Dados puros
- Só JSON e tipos TypeScript
- Nunca importar componentes aqui
- Schema em `schema.ts` — fonte de verdade para todos os tipos

### `src/lib/` — Lógica pura
- Funções puras, sem estado, sem side effects
- Não importar componentes
- Pode importar `@/data/schema` para tipos
- Pode usar `import.meta.glob` para carregar JSONs dinamicamente

### `src/components/ui/` — Átomos
- Componentes mais genéricos: Badge, Button, Card
- Sem lógica de domínio
- Recebem props, renderizam HTML

### `src/components/holiday/` — Moléculas de feriado
- Compõem componentes `ui/`
- Conhecem o tipo `Holiday` / `ResolvedHoliday`
- São Astro (sem JS no cliente)

### `src/components/interactive/` — Organismos interativos
- São React (islands)
- Recebem dados serializáveis como props vindas do Astro
- Toda interatividade do site fica aqui
- Não fazer fetch em runtime

### `src/components/layout/` — Layout
- Header, Footer, Nav, CTA
- Usados apenas no `BaseLayout`

### `src/layouts/` — Templates
- `BaseLayout.astro` é o único layout necessário no MVP
- Importa `SEO.astro`, `Header.astro`, `Footer.astro`, `LinkedInCTA.astro`

### `src/pages/` — Rotas
- Cada arquivo = uma rota
- Lógica mínima — delegar para `src/lib/`
- Compõem componentes, não criam lógica

---

## Convenções de Nomenclatura

| Tipo de arquivo | Convenção | Exemplo |
|---|---|---|
| Componente Astro | `PascalCase.astro` | `HolidayCard.astro` |
| Componente React | `PascalCase.tsx` | `HolidayCalendar.tsx` |
| Página Astro | `kebab-case.astro` | `sobre.astro` |
| Utilitário TypeScript | `camelCase.ts` | `holidays.ts` |
| JSON de estado | `MAIÚSCULO.json` | `RS.json` |
| JSON de cidade | `kebab-case.json` | `porto-alegre.json` |
| ID de feriado | `kebab-case` sem acentos | `"id": "confraternizacao-universal"` |
| Slug de estado | `kebab-case` sem acentos | `"slug": "rio-grande-do-sul"` |
| Slug de cidade | `kebab-case` sem acentos | `"slug": "porto-alegre"` |
| Constantes | `SCREAMING_SNAKE_CASE` | `const MAX_YEAR = 2030` |

---

## Arquivos Críticos — Criar Primeiro

1. `src/data/schema.ts` — Define todos os tipos. Tudo depende deste arquivo.
2. `src/lib/dates.ts` — Algoritmo da Páscoa. Necessário antes de qualquer dado ser processado.
3. `src/lib/holidays.ts` — Funções de acesso. Necessário antes das páginas.
4. `src/layouts/BaseLayout.astro` — Necessário antes de qualquer página.

---

## Tamanho Máximo de Arquivo

| Tipo | Máximo |
|---|---|
| Componente Astro | 150 linhas |
| Componente React | 200 linhas |
| Utilitário `.ts` | 250 linhas |
| Página Astro | 100 linhas de frontmatter |
| JSON de feriados | Sem limite |

Se ultrapassar, dividir em arquivos menores e importar.
