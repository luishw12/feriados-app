# AGENTS.md — Instruções para o Agente de IA

> Este arquivo define como o agente deve se comportar ao desenvolver o projeto Feriados Brasil.
> Leia este arquivo e o `PLAN.md` **integralmente** antes de qualquer ação.

---

## Papel do Agente

Você é um desenvolvedor frontend sênior especializado em **Astro v4, React, TypeScript e Tailwind CSS**. Seu objetivo é construir o site **Feriados Brasil** conforme especificado no `PLAN.md`, produzindo código limpo, tipado e performático.

---

## Antes de Qualquer Coisa

1. Leia `PLAN.md` completamente
2. Leia `STRUCTURE.md` completamente
3. Leia `.cursorrules` completamente
4. Só então comece a criar arquivos

---

## Ordem de Desenvolvimento

Execute **nessa ordem exata** para evitar dependências quebradas:

### Fase 1 — Setup
1. Criar projeto Astro: `npm create astro@latest . -- --template minimal --typescript strictest --no-install`
2. Instalar dependências conforme `package.json` do `PLAN.md`
3. Configurar `astro.config.mjs`
4. Configurar `tailwind.config.mjs`
5. Configurar `tsconfig.json` com paths alias `@/*`

### Fase 2 — Dados
6. Criar `src/data/schema.ts` — tipos TypeScript
7. Criar `src/data/states.json` — lista de estados
8. Criar `src/data/holidays/national.json` — feriados nacionais (todos os 15)
9. Criar `src/data/holidays/states/[UF].json` — um por estado (27 arquivos)
10. Criar `src/data/holidays/municipalities/[UF]/[cidade].json` — começar pelas capitais e cidades >500k hab

### Fase 3 — Lib
11. Criar `src/lib/dates.ts` — algoritmo de Páscoa + datas móveis
12. Criar `src/lib/holidays.ts` — funções de acesso a dados
13. Criar `src/lib/geolocation.ts` — detectar estado por coordenadas
14. Criar `src/lib/seo.ts` — geração de meta tags por página

### Fase 4 — Layout e UI base
15. Criar `src/styles/global.css` — reset + variáveis CSS
16. Criar `src/components/SEO.astro` — meta tags
17. Criar `src/layouts/BaseLayout.astro` — layout raiz
18. Criar componentes UI base: `Badge.astro`, `Button.astro`, `Card.astro`

### Fase 5 — Componentes Astro
19. `src/components/layout/Header.astro`
20. `src/components/layout/Footer.astro`
21. `src/components/layout/Nav.astro`
22. `src/components/layout/LinkedInCTA.astro`
23. `src/components/holiday/HolidayCard.astro`
24. `src/components/holiday/HolidayList.astro`

### Fase 6 — Componentes React (islands)
25. `src/components/interactive/ThemeToggle.tsx`
26. `src/components/interactive/YearSelector.tsx`
27. `src/components/interactive/LocationPicker.tsx`
28. `src/components/interactive/HolidayCalendar.tsx`
29. `src/components/interactive/Countdown.tsx`

### Fase 7 — Páginas
30. `src/pages/index.astro` — Home
31. `src/pages/sobre.astro` — Sobre
32. `src/pages/[estado]/index.astro` — por estado
33. `src/pages/[estado]/[cidade].astro` — por cidade

### Fase 8 — SEO e finalização
34. `public/robots.txt`
35. `public/favicon.svg`
36. `public/og/default.png` — OG image padrão
37. `README.md`
38. Testar build: `npm run build`
39. Verificar Lighthouse

---

## Padrões de Código

### Componentes Astro

```astro
---
// 1. Imports de tipos primeiro
import type { Holiday } from '@/data/schema';

// 2. Imports de componentes
import Badge from '@/components/ui/Badge.astro';

// 3. Interface de Props explícita sempre
interface Props {
  holiday: Holiday;
  showDescription?: boolean;
}

// 4. Desestruturar props
const { holiday, showDescription = true } = Astro.props;

// 5. Lógica derivada no frontmatter, nunca no template
const formattedDate = holiday.resolvedDate.toLocaleDateString('pt-BR');
---

<!-- Template limpo -->
<div class="rounded-lg p-4 bg-surface-light dark:bg-surface-dark">
  <Badge type={holiday.type} />
  <h3 class="font-semibold text-neutral-900 dark:text-neutral-50">{holiday.name}</h3>
  {showDescription && <p class="text-sm text-neutral-600 dark:text-neutral-400">{holiday.description}</p>}
</div>
```

### Componentes React (islands)

```tsx
// Sem 'use client' — não é Next.js
import { useState, useEffect } from 'react';
import type { ResolvedHoliday } from '@/data/schema';

interface Props {
  holidays: ResolvedHoliday[];
  initialYear?: number;
}

// Export default sempre — sem named exports em componentes
export default function HolidayCalendar({ holidays, initialYear = new Date().getFullYear() }: Props) {
  const [year, setYear] = useState(initialYear);
  
  // lógica derivada sem useEffect quando possível
  const filteredHolidays = holidays.filter(
    h => h.resolvedDate.getFullYear() === year
  );

  return (
    <div className="...">
      {/* template */}
    </div>
  );
}
```

### Páginas com getStaticPaths

```astro
---
import { getAllStates, getAllHolidaysForContext } from '@/lib/holidays';
import type { GetStaticPaths } from 'astro';
import type { StateInfo } from '@/data/schema';

export const getStaticPaths: GetStaticPaths = async () => {
  const states = getAllStates();
  return states.map((state) => ({
    params: { estado: state.slug },
    props: { state },
  }));
};

interface Props {
  state: StateInfo;
}

const { state } = Astro.props;
const year = new Date().getFullYear();
const holidays = getAllHolidaysForContext(year, state.uf);
---
```

---

## Regras de Qualidade

### TypeScript
- `strict: true` em todo o projeto
- Sem `any` — use `unknown` e faça type narrowing
- Sem `as Type` para escapar do sistema de tipos
- Interfaces para objetos, types para unions

### Tailwind
- Sem `style={}` inline
- Dark mode via `dark:` classes (`darkMode: 'class'`)
- Sem classes arbitrárias `[valor]` quando existe equivalente nativo Tailwind
- Extrair classes repetidas em variáveis de template se usadas 3+ vezes no mesmo arquivo

### Astro
- `<Image />` do Astro para todas as imagens — nunca `<img>` raw
- Canonical URL em toda página
- `lang="pt-BR"` no `<html>`
- `charset="UTF-8"` e `viewport` no `<head>`

### React
- Functional components apenas
- Sem class components
- `useEffect` apenas quando realmente necessário (timers, eventos DOM externos)
- Props derivadas devem ser computadas no corpo do componente, não em effects

### Acessibilidade (a11y)
- Elementos semânticos HTML5: `<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`, `<section>`
- `aria-label` em todos os ícones sem texto visível adjacente
- Contraste mínimo 4.5:1 (Tailwind já garante na maioria dos casos com as classes padrão)
- Navegação por teclado: todos os elementos interativos devem ser focáveis com Tab
- `role="button"` em divs clicáveis (preferir `<button>` sempre)

### Performance
- Sem fetch em runtime — apenas import de JSON
- Fontes auto-hospedadas via `@fontsource/inter`
- Diretiva correta por componente: `client:load` / `client:idle` / `client:visible`
- Sem bibliotecas de animação pesadas

---

## Dados — Regras Importantes

### Feriados com datas fixas
- Formato: `"date": "MM-DD"` (sempre com zero à esquerda)
- Exemplo: `"date": "01-01"`, `"date": "12-25"`

### Feriados com datas móveis
- Formato: `"dateRule": "easter[+/-][N]"`
- Páscoa: `"dateRule": "easter+0"`
- Carnaval (terça): `"dateRule": "easter-47"`
- Sexta-feira Santa: `"dateRule": "easter-2"`
- Corpus Christi: `"dateRule": "easter+60"`

### IDs de feriados
- Sempre em `kebab-case` sem acentos
- Deve ser único globalmente no projeto
- Exemplo: `"id": "confraternizacao-universal"`, `"id": "revolucao-farroupilha"`

### Slugs de estado
- Sempre em `kebab-case` sem acentos
- Exemplo: `"slug": "rio-grande-do-sul"`, `"slug": "sao-paulo"`

### Slugs de cidade
- Sempre em `kebab-case` sem acentos
- Exemplo: `"slug": "porto-alegre"`, `"slug": "sao-paulo"`

---

## SEO — Regras

- Toda página usa o componente `<SEO />` dentro do `<BaseLayout>`
- Canonical URL sempre relativa à raiz do site
- OG image padrão em `/og/default.png`
- Schema.org Event como JSON-LD em páginas com feriados
- Sitemap gerado automaticamente pelo `@astrojs/sitemap` — incluir `site` no `astro.config.mjs`

---

## Commits (se aplicável)

Usar Conventional Commits:

```
feat: adicionar countdown para próximo feriado
fix: corrigir cálculo da Páscoa para anos bissextos
data: adicionar feriados municipais do RS
style: ajustar cores do dark mode no calendário
chore: atualizar dependências
docs: atualizar README com instruções de deploy
```

---

## Checklist Final (antes de considerar pronto)

- [ ] `npm run build` sem erros
- [ ] Todas as rotas dinâmicas geram paths corretamente
- [ ] Dark mode funciona em todos os componentes
- [ ] Geolocation funciona e tem fallback gracioso
- [ ] Countdown atualiza em tempo real
- [ ] Página `/sobre` tem CTA do LinkedIn visível
- [ ] Banner do LinkedIn aparece em todas as páginas
- [ ] Sitemap gerado em `/sitemap-index.xml`
- [ ] `robots.txt` em `/robots.txt`
- [ ] Meta tags completas em todas as páginas
- [ ] Schema.org presente nas páginas de estado e cidade
- [ ] Lighthouse Performance > 95 na home
- [ ] Lighthouse SEO = 100 na home
- [ ] Lighthouse Accessibility > 95 na home
- [ ] Sem erros de TypeScript (`tsc --noEmit`)
- [ ] Sem imagens com `<img>` raw (usar `<Image />` do Astro)
