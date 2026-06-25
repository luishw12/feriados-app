# 🇧🇷 Feriados Brasil — Plano Completo do Projeto

> Leia este arquivo inteiramente antes de qualquer ação. Ele é o documento de referência máxima do projeto.

---

## Visão Geral

Site público e open source para visualização de **todos os feriados do Brasil** em formato de calendário. O usuário vê os feriados do seu estado e cidade de forma clara e visualmente agradável, com detecção automática de localização.

O projeto serve como portfólio técnico do desenvolvedor, com foco em **SEO orgânico** para captação de leads profissionais e tráfego de usuários via busca orgânica, com CTAs direcionando para o LinkedIn do autor.

**Repositório:** `github.com/luishw12/feriados-app`
**Deploy:** Vercel (free tier)
**Licença:** MIT (Open Source)

---

## Objetivos

| # | Objetivo | Métrica |
|---|---|---|
| 1 | Ferramenta útil e rápida | LCP < 2.5s, Lighthouse > 95 |
| 2 | Portfólio técnico de qualidade | Código limpo, bem estruturado, documentado |
| 3 | Tráfego orgânico via SEO | Ranquear para "feriados [estado] [ano]" |
| 4 | Converter visitantes em leads LinkedIn | CTR do CTA de LinkedIn |

---

## Stack

### Decisão: Astro v4 + React Islands + Tailwind CSS v3

**Justificativa para Astro sobre Next.js:**
Este projeto é composto majoritariamente de dados estáticos (feriados não mudam durante o ano). O Astro entrega HTML puro sem JavaScript no cliente por padrão — React é injetado apenas nos componentes que precisam de interatividade (calendário, contador, localização). O resultado são Core Web Vitals quase perfeitos, que são o principal fator de ranqueamento no Google.

| Tecnologia | Versão | Função |
|---|---|---|
| **Astro** | v4 | Framework principal — SSG puro, zero-JS por default |
| **React** | v18 | Islands — hidratação parcial só onde há interatividade |
| **Tailwind CSS** | v3 | Estilização utility-first |
| **TypeScript** | v5 | Tipagem em todo o projeto |
| **date-fns** | v3 | Manipulação de datas (leve, tree-shakeable) |
| **Lucide React** | latest | Ícones (leve, tree-shakeable) |
| **@fontsource/inter** | latest | Font auto-hospedada (sem Google Fonts) |
| **@astrojs/sitemap** | latest | Sitemap automático para SEO |
| **@astrojs/react** | latest | Integração React no Astro |
| **@astrojs/tailwind** | latest | Integração Tailwind no Astro |
| **Vercel** | — | Hosting + CDN global (free tier) |
| **Vercel Analytics** | — | Analytics sem cookies (LGPD-friendly) |

### Não usar
- Google Fonts (prejudica performance — usar @fontsource)
- Bibliotecas de estado globais (Redux, Zustand — useState/context suficientes)
- Bibliotecas de calendário prontas (construir o componente)
- API calls em runtime (dados são 100% estáticos)
- CSS Modules (apenas Tailwind)

---

## Funcionalidades

### MVP — v1.0

- [ ] Calendário anual com grade de 12 meses
- [ ] Cada dia com feriado é marcado visualmente com cor por tipo
- [ ] Detecção automática de localização (Geolocation API)
- [ ] Seletor manual de estado → cidade (fallback sem GPS)
- [ ] Diferenciação visual por tipo de feriado (nacional, estadual, municipal, facultativo)
- [ ] Contador regressivo para o próximo feriado
- [ ] Toggle Dark / Light mode (segue sistema do usuário por padrão)
- [ ] CTA fixo para LinkedIn do autor
- [ ] Páginas estáticas por estado (SEO)
- [ ] Páginas estáticas por cidade (SEO)
- [ ] Sitemap automático
- [ ] Robots.txt
- [ ] README.md público com instruções

### Futuro — v2.0+

- [ ] Exportar feriados para `.ics` (Google Calendar / Apple Calendar)
- [ ] PWA — instalar no celular como app
- [ ] OG Images dinâmicas por estado/cidade
- [ ] API pública JSON para outros desenvolvedores consumirem
- [ ] Mapa SVG do Brasil clicável para navegação por estado

---

## Tipos de Feriado

| Tipo | ID | Cor | Descrição | Exemplos |
|---|---|---|---|---|
| Nacional | `national` | `emerald` (verde) | Válido em todo o Brasil, obrigatório | Natal, Ano Novo, Tiradentes |
| Estadual | `state` | `blue` (azul) | Válido apenas no estado | Aniversário do estado, santos padroeiros estaduais |
| Municipal | `municipal` | `purple` (roxo) | Válido apenas no município | Aniversário da cidade |
| Facultativo Nacional | `optional` | `amber` (amarelo) | Não obrigatório, abrangência nacional | Carnaval, Dia do Servidor Público |
| Facultativo Estadual | `state_optional` | `orange` (laranja) | Não obrigatório, abrangência estadual | Varia por estado |

---

## Arquitetura de Dados

Todos os dados são **JSON estático versionado no repositório**. Sem dependência de API externa em runtime.

### Estrutura de arquivos de dados

```
src/data/
├── schema.ts                    # Tipos TypeScript — CRIAR PRIMEIRO
├── states.json                  # Lista de todos os estados com metadados
└── holidays/
    ├── national.json            # Feriados nacionais + facultativos nacionais
    ├── states/                  # Um arquivo por UF (27 arquivos)
    │   ├── AC.json
    │   ├── AL.json
    │   ├── AM.json
    │   ├── AP.json
    │   ├── BA.json
    │   ├── CE.json
    │   ├── DF.json
    │   ├── ES.json
    │   ├── GO.json
    │   ├── MA.json
    │   ├── MG.json
    │   ├── MS.json
    │   ├── MT.json
    │   ├── PA.json
    │   ├── PB.json
    │   ├── PE.json
    │   ├── PI.json
    │   ├── PR.json
    │   ├── RJ.json
    │   ├── RN.json
    │   ├── RO.json
    │   ├── RR.json
    │   ├── RS.json
    │   ├── SC.json
    │   ├── SE.json
    │   ├── SP.json
    │   └── TO.json
    └── municipalities/          # Um diretório por UF, um JSON por cidade
        ├── AC/
        ├── AL/
        ├── AM/
        ├── ...
        ├── RS/
        │   ├── porto-alegre.json
        │   ├── caxias-do-sul.json
        │   ├── pelotas.json
        │   ├── canoas.json
        │   ├── santa-maria.json
        │   └── lajeado.json
        └── SP/
            ├── sao-paulo.json
            ├── campinas.json
            └── ...
```

### Schema TypeScript — `src/data/schema.ts`

```typescript
export type HolidayType =
  | 'national'
  | 'state'
  | 'municipal'
  | 'optional'
  | 'state_optional';

export interface Holiday {
  id: string;          // Slug único: "confraternizacao-universal"
  name: string;        // "Confraternização Universal"
  date?: string;       // "MM-DD" — para datas fixas. Ex: "01-01"
  dateRule?: string;   // Para datas móveis. Ex: "easter-47", "easter+60"
  type: HolidayType;
  description?: string;
}

export interface StateHolidayFile {
  uf: string;          // "RS"
  name: string;        // "Rio Grande do Sul"
  slug: string;        // "rio-grande-do-sul"
  holidays: Holiday[];
}

export interface MunicipalityHolidayFile {
  ibgeCode: number;    // Código IBGE: 4311403
  name: string;        // "Lajeado"
  slug: string;        // "lajeado"
  uf: string;          // "RS"
  holidays: Holiday[];
}

export interface StateInfo {
  uf: string;
  name: string;
  slug: string;
  capital: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
}

// Tipo resolvido após processar datas móveis
export interface ResolvedHoliday extends Holiday {
  resolvedDate: Date;
  state?: string;
  city?: string;
}
```

### Exemplo de `national.json`

```json
[
  {
    "id": "confraternizacao-universal",
    "name": "Confraternização Universal",
    "date": "01-01",
    "type": "national",
    "description": "Celebrado mundialmente, marca o início do ano novo."
  },
  {
    "id": "carnaval-segunda",
    "name": "Carnaval (Segunda-feira)",
    "dateRule": "easter-48",
    "type": "optional",
    "description": "Feriado facultativo. 48 dias antes da Páscoa."
  },
  {
    "id": "carnaval-terca",
    "name": "Carnaval (Terça-feira)",
    "dateRule": "easter-47",
    "type": "optional",
    "description": "Feriado facultativo. 47 dias antes da Páscoa."
  },
  {
    "id": "quarta-cinzas",
    "name": "Quarta-feira de Cinzas",
    "dateRule": "easter-46",
    "type": "optional",
    "description": "Feriado facultativo, meio período."
  },
  {
    "id": "sexta-santa",
    "name": "Sexta-feira Santa",
    "dateRule": "easter-2",
    "type": "national",
    "description": "Paixão de Cristo. 2 dias antes da Páscoa."
  },
  {
    "id": "pascoa",
    "name": "Páscoa",
    "dateRule": "easter+0",
    "type": "national",
    "description": "Data calculada pelo algoritmo de Meeus/Jones/Butcher."
  },
  {
    "id": "tiradentes",
    "name": "Tiradentes",
    "date": "04-21",
    "type": "national",
    "description": "Homenagem ao mártir da Inconfidência Mineira."
  },
  {
    "id": "dia-do-trabalho",
    "name": "Dia do Trabalho",
    "date": "05-01",
    "type": "national",
    "description": "Dia Internacional do Trabalho."
  },
  {
    "id": "corpus-christi",
    "name": "Corpus Christi",
    "dateRule": "easter+60",
    "type": "optional",
    "description": "Feriado facultativo. 60 dias após a Páscoa."
  },
  {
    "id": "independencia",
    "name": "Independência do Brasil",
    "date": "09-07",
    "type": "national",
    "description": "Proclamação da Independência em 1822."
  },
  {
    "id": "nossa-senhora-aparecida",
    "name": "Nossa Senhora Aparecida",
    "date": "10-12",
    "type": "national",
    "description": "Padroeira do Brasil."
  },
  {
    "id": "finados",
    "name": "Finados",
    "date": "11-02",
    "type": "national",
    "description": "Dia de homenagem aos mortos."
  },
  {
    "id": "proclamacao-republica",
    "name": "Proclamação da República",
    "date": "11-15",
    "type": "national",
    "description": "Proclamação da República Federativa do Brasil em 1889."
  },
  {
    "id": "consciencia-negra",
    "name": "Dia da Consciência Negra",
    "date": "11-20",
    "type": "national",
    "description": "Lei 14.759/2023 tornou feriado nacional a partir de 2024."
  },
  {
    "id": "natal",
    "name": "Natal",
    "date": "12-25",
    "type": "national",
    "description": "Celebração do nascimento de Jesus Cristo."
  }
]
```

### Exemplo de `states/RS.json`

```json
{
  "uf": "RS",
  "name": "Rio Grande do Sul",
  "slug": "rio-grande-do-sul",
  "holidays": [
    {
      "id": "revolucao-farroupilha",
      "name": "Revolução Farroupilha",
      "date": "09-20",
      "type": "state",
      "description": "Comemora o início da Revolução Farroupilha em 1835."
    }
  ]
}
```

### Exemplo de `municipalities/RS/lajeado.json`

```json
{
  "ibgeCode": 4311403,
  "name": "Lajeado",
  "slug": "lajeado",
  "uf": "RS",
  "holidays": [
    {
      "id": "aniversario-lajeado",
      "name": "Aniversário de Lajeado",
      "date": "06-08",
      "type": "municipal",
      "description": "Fundação do município de Lajeado em 1891."
    }
  ]
}
```

### `states.json`

```json
[
  { "uf": "AC", "name": "Acre", "slug": "acre", "capital": "Rio Branco", "region": "Norte" },
  { "uf": "AL", "name": "Alagoas", "slug": "alagoas", "capital": "Maceió", "region": "Nordeste" },
  { "uf": "AM", "name": "Amazonas", "slug": "amazonas", "capital": "Manaus", "region": "Norte" },
  { "uf": "AP", "name": "Amapá", "slug": "amapa", "capital": "Macapá", "region": "Norte" },
  { "uf": "BA", "name": "Bahia", "slug": "bahia", "capital": "Salvador", "region": "Nordeste" },
  { "uf": "CE", "name": "Ceará", "slug": "ceara", "capital": "Fortaleza", "region": "Nordeste" },
  { "uf": "DF", "name": "Distrito Federal", "slug": "distrito-federal", "capital": "Brasília", "region": "Centro-Oeste" },
  { "uf": "ES", "name": "Espírito Santo", "slug": "espirito-santo", "capital": "Vitória", "region": "Sudeste" },
  { "uf": "GO", "name": "Goiás", "slug": "goias", "capital": "Goiânia", "region": "Centro-Oeste" },
  { "uf": "MA", "name": "Maranhão", "slug": "maranhao", "capital": "São Luís", "region": "Nordeste" },
  { "uf": "MG", "name": "Minas Gerais", "slug": "minas-gerais", "capital": "Belo Horizonte", "region": "Sudeste" },
  { "uf": "MS", "name": "Mato Grosso do Sul", "slug": "mato-grosso-do-sul", "capital": "Campo Grande", "region": "Centro-Oeste" },
  { "uf": "MT", "name": "Mato Grosso", "slug": "mato-grosso", "capital": "Cuiabá", "region": "Centro-Oeste" },
  { "uf": "PA", "name": "Pará", "slug": "para", "capital": "Belém", "region": "Norte" },
  { "uf": "PB", "name": "Paraíba", "slug": "paraiba", "capital": "João Pessoa", "region": "Nordeste" },
  { "uf": "PE", "name": "Pernambuco", "slug": "pernambuco", "capital": "Recife", "region": "Nordeste" },
  { "uf": "PI", "name": "Piauí", "slug": "piaui", "capital": "Teresina", "region": "Nordeste" },
  { "uf": "PR", "name": "Paraná", "slug": "parana", "capital": "Curitiba", "region": "Sul" },
  { "uf": "RJ", "name": "Rio de Janeiro", "slug": "rio-de-janeiro", "capital": "Rio de Janeiro", "region": "Sudeste" },
  { "uf": "RN", "name": "Rio Grande do Norte", "slug": "rio-grande-do-norte", "capital": "Natal", "region": "Nordeste" },
  { "uf": "RO", "name": "Rondônia", "slug": "rondonia", "capital": "Porto Velho", "region": "Norte" },
  { "uf": "RR", "name": "Roraima", "slug": "roraima", "capital": "Boa Vista", "region": "Norte" },
  { "uf": "RS", "name": "Rio Grande do Sul", "slug": "rio-grande-do-sul", "capital": "Porto Alegre", "region": "Sul" },
  { "uf": "SC", "name": "Santa Catarina", "slug": "santa-catarina", "capital": "Florianópolis", "region": "Sul" },
  { "uf": "SE", "name": "Sergipe", "slug": "sergipe", "capital": "Aracaju", "region": "Nordeste" },
  { "uf": "SP", "name": "São Paulo", "slug": "sao-paulo", "capital": "São Paulo", "region": "Sudeste" },
  { "uf": "TO", "name": "Tocantins", "slug": "tocantins", "capital": "Palmas", "region": "Norte" }
]
```

---

## Lógica de Datas Móveis — `src/lib/dates.ts`

As datas móveis são calculadas com base na Páscoa usando o algoritmo de Meeus/Jones/Butcher.

```typescript
// Algoritmo para calcular a Páscoa
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Resolver regra de data móvel
// Ex: "easter-47" = Páscoa menos 47 dias
// Ex: "easter+60" = Páscoa mais 60 dias
export function resolveDateRule(rule: string, year: number): Date {
  const match = rule.match(/^easter([+-]\d+)$/);
  if (!match) throw new Error(`Invalid date rule: ${rule}`);
  const offset = parseInt(match[1]);
  const easter = getEasterDate(year);
  const result = new Date(easter);
  result.setDate(result.getDate() + offset);
  return result;
}

// Resolver qualquer feriado (fixo ou móvel) para um ano
export function resolveHolidayDate(holiday: Holiday, year: number): Date {
  if (holiday.date) {
    const [month, day] = holiday.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  if (holiday.dateRule) {
    return resolveDateRule(holiday.dateRule, year);
  }
  throw new Error(`Holiday ${holiday.id} has no date or dateRule`);
}
```

---

## Funções de Acesso a Dados — `src/lib/holidays.ts`

```typescript
import nationalHolidays from '@/data/holidays/national.json';
import statesData from '@/data/states.json';
import { resolveHolidayDate } from './dates';
import type { Holiday, ResolvedHoliday, StateInfo } from '@/data/schema';

// Importar todos os estados dinamicamente
// Usar import.meta.glob do Vite/Astro
const stateFiles = import.meta.glob('../data/holidays/states/*.json', { eager: true });
const municipalityFiles = import.meta.glob('../data/holidays/municipalities/**/*.json', { eager: true });

export function getAllNationalHolidays(year: number): ResolvedHoliday[] {
  return nationalHolidays.map(h => ({
    ...h,
    resolvedDate: resolveHolidayDate(h as Holiday, year),
  }));
}

export function getHolidaysByState(uf: string, year: number): ResolvedHoliday[] {
  const key = Object.keys(stateFiles).find(k => k.includes(`/${uf}.json`));
  if (!key) return [];
  const file = stateFiles[key] as any;
  return file.holidays.map((h: Holiday) => ({
    ...h,
    resolvedDate: resolveHolidayDate(h, year),
    state: uf,
  }));
}

export function getHolidaysByCity(uf: string, citySlug: string, year: number): ResolvedHoliday[] {
  const key = Object.keys(municipalityFiles).find(
    k => k.includes(`/${uf}/`) && k.includes(`/${citySlug}.json`)
  );
  if (!key) return [];
  const file = municipalityFiles[key] as any;
  return file.holidays.map((h: Holiday) => ({
    ...h,
    resolvedDate: resolveHolidayDate(h, year),
    state: uf,
    city: citySlug,
  }));
}

export function getAllHolidaysForContext(
  year: number,
  uf?: string,
  citySlug?: string
): ResolvedHoliday[] {
  const national = getAllNationalHolidays(year);
  const state = uf ? getHolidaysByState(uf, year) : [];
  const municipal = (uf && citySlug) ? getHolidaysByCity(uf, citySlug, year) : [];
  return [...national, ...state, ...municipal].sort(
    (a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime()
  );
}

export function getNextHoliday(holidays: ResolvedHoliday[]): ResolvedHoliday | null {
  const now = new Date();
  return holidays.find(h => h.resolvedDate >= now) ?? null;
}

export function getHolidaysForMonth(
  holidays: ResolvedHoliday[],
  year: number,
  month: number // 0-indexed
): ResolvedHoliday[] {
  return holidays.filter(
    h => h.resolvedDate.getFullYear() === year && h.resolvedDate.getMonth() === month
  );
}

export function getAllStates(): StateInfo[] {
  return statesData as StateInfo[];
}
```

---

## Lógica de Geolocalização — `src/lib/geolocation.ts`

```typescript
// Mapear coordenadas para UF usando bounding boxes dos estados
// Lista completa de bounding boxes a ser incluída

export interface LocationResult {
  uf: string;
  stateName: string;
  stateSlug: string;
}

export async function detectUserState(): Promise<LocationResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const uf = getUFFromCoordinates(latitude, longitude);
        if (!uf) { resolve(null); return; }
        // buscar estado na lista de estados
        resolve(uf ? mapUFToResult(uf) : null);
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

// Implementar com bounding boxes dos estados brasileiros
function getUFFromCoordinates(lat: number, lng: number): string | null {
  // A implementação completa deve incluir os bounding boxes de todos os 27 estados
  // Fonte de referência: IBGE shapefile ou dataset público
  // Alternativa simples: usar a API do IBGE nominatim para reverse geocoding
  // GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json
  // O campo address.state retorna o nome do estado
  return null; // substituir pela implementação
}
```

> **Nota para o agente:** Para detecção de estado por coordenadas, usar a API do Nominatim (OpenStreetMap) via fetch em runtime, pois bounding boxes estáticos são imprecisos em fronteiras. Fazer o fetch apenas quando o usuário autorizar a localização.

---

## Páginas e Rotas

| Rota | Arquivo | Tipo | Descrição |
|---|---|---|---|
| `/` | `src/pages/index.astro` | SSG | Home — calendário anual, localização automática |
| `/[estado]` | `src/pages/[estado]/index.astro` | SSG | Feriados do estado. Ex: `/rio-grande-do-sul` |
| `/[estado]/[cidade]` | `src/pages/[estado]/[cidade].astro` | SSG | Feriados da cidade. Ex: `/rio-grande-do-sul/lajeado` |
| `/sobre` | `src/pages/sobre.astro` | SSG | Sobre o projeto e autor — CTA LinkedIn |
| `/sitemap.xml` | Auto | Auto | Gerado pelo @astrojs/sitemap |
| `/robots.txt` | `public/robots.txt` | Static | |

### Geração de paths estáticos

A home não precisa de paths dinâmicos. As páginas de estado e cidade usam `getStaticPaths()`:

```typescript
// src/pages/[estado]/index.astro
export async function getStaticPaths() {
  const states = getAllStates();
  return states.map(state => ({
    params: { estado: state.slug },
    props: { state },
  }));
}

// src/pages/[estado]/[cidade].astro
export async function getStaticPaths() {
  // Iterar todos os arquivos de municípios e gerar paths
  const municipalityFiles = import.meta.glob(
    '../../data/holidays/municipalities/**/*.json',
    { eager: true }
  );
  return Object.entries(municipalityFiles).map(([path, data]) => {
    const file = data as MunicipalityHolidayFile;
    const state = getAllStates().find(s => s.uf === file.uf)!;
    return {
      params: { estado: state.slug, cidade: file.slug },
      props: { state, municipality: file },
    };
  });
}
```

---

## SEO

### Títulos por página

| Página | Title | Description |
|---|---|---|
| Home | `Feriados no Brasil {ano} — Calendário Completo por Estado e Cidade` | `Veja todos os feriados nacionais, estaduais e municipais do Brasil em {ano}. Calendário atualizado com datas fixas e móveis por estado e cidade.` |
| Estado | `Feriados em {Estado} {ano} — Nacionais, Estaduais e Municipais` | `Calendário completo de feriados em {Estado} para {ano}. Inclui feriados nacionais, estaduais e facultativos com todas as datas.` |
| Cidade | `Feriados em {Cidade}/{UF} {ano} — Calendário Municipal Completo` | `Todos os feriados em {Cidade}, {Estado} para {ano}. Inclui feriados municipais, estaduais e nacionais.` |

### Componente `SEO.astro`

```astro
---
interface Props {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}
const { title, description, canonical, ogImage = '/og/default.png' } = Astro.props;
const siteUrl = import.meta.env.SITE;
---

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={`${siteUrl}${canonical}`} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={`${siteUrl}${ogImage}`} />
<meta property="og:type" content="website" />
<meta property="og:url" content={`${siteUrl}${canonical}`} />
<meta property="og:locale" content="pt_BR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
```

### Schema.org Event

Cada feriado renderizado na página deve incluir JSON-LD:

```astro
---
// Para cada feriado na página
const schemaEvents = holidays.map(h => ({
  '@type': 'Event',
  name: h.name,
  startDate: h.resolvedDate.toISOString().split('T')[0],
  description: h.description,
  location: {
    '@type': 'Country',
    name: 'Brasil',
  },
  eventStatus: 'https://schema.org/EventScheduled',
  organizer: {
    '@type': 'GovernmentOrganization',
    name: 'Governo Federal do Brasil',
  },
}));

const schema = {
  '@context': 'https://schema.org',
  '@graph': schemaEvents,
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

---

## Design System

### Paleta de cores por tipo de feriado

| Tipo | Classe Tailwind (bg) | Classe Tailwind (text) | Hex |
|---|---|---|---|
| Nacional | `bg-emerald-500` | `text-emerald-700` | `#10b981` |
| Estadual | `bg-blue-500` | `text-blue-700` | `#3b82f6` |
| Municipal | `bg-purple-500` | `text-purple-700` | `#a855f7` |
| Facultativo Nacional | `bg-amber-400` | `text-amber-700` | `#f59e0b` |
| Facultativo Estadual | `bg-orange-400` | `text-orange-700` | `#fb923c` |

### Cores do tema

```js
// tailwind.config.mjs — theme.extend.colors
colors: {
  holiday: {
    national: '#10b981',
    state: '#3b82f6',
    municipal: '#a855f7',
    optional: '#f59e0b',
    state_optional: '#fb923c',
  },
  surface: {
    light: '#ffffff',
    dark: '#111111',
  },
  background: {
    light: '#fafafa',
    dark: '#0a0a0a',
  }
}
```

### Tipografia

- **Font:** Inter via `@fontsource/inter` (400, 500, 600, 700)
- **Self-hosted:** `import '@fontsource/inter/400.css'` no layout base
- **Headings:** `font-semibold` (`font-weight: 600`)
- **Body:** `font-normal` (`font-weight: 400`)
- **Mono:** `font-mono` do sistema (para contagem regressiva)

### Animações

Usar apenas Tailwind transitions — sem bibliotecas:
- Hover em cards: `transition-colors duration-150`
- Abertura de tooltip: `transition-opacity duration-200`
- Toggle de tema: `transition-colors duration-300`

---

## Componentes Detalhados

### Componentes Astro (sem JS no cliente)

| Componente | Arquivo | Descrição |
|---|---|---|
| `BaseLayout` | `src/layouts/BaseLayout.astro` | Layout raiz: HTML, SEO, Header, Footer |
| `Header` | `src/components/layout/Header.astro` | Logo, nav, ThemeToggle island |
| `Footer` | `src/components/layout/Footer.astro` | Créditos, links, GitHub |
| `Nav` | `src/components/layout/Nav.astro` | Navegação principal |
| `LinkedInCTA` | `src/components/layout/LinkedInCTA.astro` | Botão fixo canto inferior direito |
| `SEO` | `src/components/SEO.astro` | Meta tags completas |
| `HolidayCard` | `src/components/holiday/HolidayCard.astro` | Card de um feriado |
| `HolidayList` | `src/components/holiday/HolidayList.astro` | Lista de feriados de um mês |
| `HolidayBadge` | `src/components/ui/Badge.astro` | Badge colorida por tipo |
| `Button` | `src/components/ui/Button.astro` | Botão base |
| `Card` | `src/components/ui/Card.astro` | Card container base |

### Componentes React (islands — com JS no cliente)

| Componente | Arquivo | Diretiva | Descrição |
|---|---|---|---|
| `HolidayCalendar` | `src/components/interactive/HolidayCalendar.tsx` | `client:load` | Grade de 12 meses com feriados marcados |
| `Countdown` | `src/components/interactive/Countdown.tsx` | `client:idle` | Contador regressivo para próximo feriado |
| `LocationPicker` | `src/components/interactive/LocationPicker.tsx` | `client:load` | Geolocation + seletor manual estado/cidade |
| `ThemeToggle` | `src/components/interactive/ThemeToggle.tsx` | `client:load` | Dark/Light toggle com persistência em localStorage |
| `YearSelector` | `src/components/interactive/YearSelector.tsx` | `client:load` | Navegar entre anos (+/- do ano atual) |

### Diretivas de hidratação — regra de ouro

- `client:load` — componentes visíveis imediatamente e críticos para UX (toggle, localização)
- `client:idle` — componentes não críticos, carregam quando browser está idle (countdown)
- `client:visible` — componentes fora do viewport inicial (calendários mais abaixo na página)

---

## CTA LinkedIn

### Posicionamento

1. **Banner fixo** no canto inferior direito — sempre visível, não intrusivo
2. **Card na página `/sobre`** — mais elaborado, com texto do autor
3. **Link no footer** — sutil

### Copy do banner fixo

```astro
<!-- LinkedInCTA.astro -->
<a
  href="https://linkedin.com/in/[seu-usuario]"
  target="_blank"
  rel="noopener noreferrer"
  class="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#0A66C2] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#004182] transition-colors duration-200 text-sm font-medium"
>
  <!-- Ícone LinkedIn SVG inline -->
  Desenvolvido por [Nome] · LinkedIn ↗
</a>
```

---

## Configurações do Projeto

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://feriados.luishw.com.br',
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  output: 'static',
});
```

### `tailwind.config.mjs`

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        holiday: {
          national: '#10b981',
          state: '#3b82f6',
          municipal: '#a855f7',
          optional: '#f59e0b',
          state_optional: '#fb923c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `package.json` (dependências principais)

```json
{
  "name": "feriados-brasil",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/react": "^3.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "@fontsource/inter": "^5.0.0",
    "astro": "^4.0.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.400.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Deploy

### Vercel (recomendado)

1. Repositório no GitHub: `github.com/luishw12/feriados-app`
2. Importar projeto no Vercel: [vercel.com/new](https://vercel.com/new)
3. Astro é detectado automaticamente — zero configuração
4. Habilitar Vercel Analytics no dashboard (free, sem cookies)
5. (Opcional) Configurar domínio customizado

### `vercel.json`

```json
{
  "buildCommand": "astro build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

### `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://feriados.luishw.com.br/sitemap-index.xml
```

---

## README.md Público

O README deve ser completo e profissional pois é cartão de visitas no GitHub:

```markdown
# 🇧🇷 Feriados Brasil

Calendário interativo com todos os feriados do Brasil — nacionais, estaduais e municipais.

**[→ Acesse o site](https://feriados.luishw.com.br)**

## Funcionalidades

- 📅 Calendário anual com todos os feriados marcados
- 📍 Detecção automática de localização (com sua permissão)
- 🏛️ Feriados nacionais, estaduais e municipais
- ⏱️ Contador regressivo para o próximo feriado
- 🌙 Dark e Light mode
- ⚡ Site ultra rápido — 100% estático

## Tech Stack

Astro · React · Tailwind CSS · TypeScript · Vercel

## Contribuir

Encontrou um feriado errado ou faltando? Abra uma issue ou envie um PR!
Os dados ficam em `src/data/holidays/`.

## Autor

Feito por **[Nome]** · [LinkedIn](https://linkedin.com/in/[usuario]) · [GitHub](https://github.com/[usuario])
```

---

## Roadmap

### v1.0 — MVP
- [ ] Setup projeto Astro + React + Tailwind
- [ ] Tipos TypeScript (`schema.ts`)
- [ ] Dados JSON: todos os 15 feriados nacionais
- [ ] Dados JSON: todos os 27 estados
- [ ] Dados JSON: top 50 municípios (por população)
- [ ] Componente de calendário interativo
- [ ] Detecção de localização
- [ ] Seletor manual estado → cidade
- [ ] Countdown para próximo feriado
- [ ] Dark/Light toggle
- [ ] CTA LinkedIn
- [ ] SEO completo (meta tags, sitemap, robots)
- [ ] Deploy Vercel

### v1.1
- [ ] Dados JSON: municípios restantes (todos os 5570 municípios — priorizar capitais e cidades com >100k hab primeiro)
- [ ] Schema.org Event em todas as páginas
- [ ] OG Images por estado

### v2.0
- [ ] Exportar feriados para `.ics`
- [ ] PWA com manifest
- [ ] API pública JSON em `/api/feriados/[ano]` e `/api/feriados/[ano]/[uf]`
