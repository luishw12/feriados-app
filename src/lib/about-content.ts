import type { FaqItem } from '@/lib/llms';

export type AboutFeatureIcon =
  | 'calendar'
  | 'location'
  | 'layers'
  | 'timer'
  | 'moon'
  | 'article';

export interface AboutFeature {
  icon: AboutFeatureIcon;
  title: string;
  description: string;
}

export interface AboutUsefulLink {
  href: string;
  title: string;
  description: string;
  external?: boolean;
}

export const ABOUT_FEATURES: AboutFeature[] = [
  {
    icon: 'calendar',
    title: 'Calendário interativo',
    description: 'Visualize feriados mês a mês e navegue entre anos com um seletor rápido.',
  },
  {
    icon: 'location',
    title: 'Busca por cidade ou estado',
    description:
      'Combobox unificado na home: filtre por nome da cidade (ex.: "Lajeado") ou estado/UF (ex.: "RS"). Geolocalização opcional.',
  },
  {
    icon: 'layers',
    title: 'Tipos de feriado',
    description:
      'Diferencie nacionais, estaduais, municipais e facultativos com cores e legendas claras.',
  },
  {
    icon: 'timer',
    title: 'Contador regressivo',
    description: 'Saiba quanto falta para o próximo feriado do seu contexto local.',
  },
  {
    icon: 'moon',
    title: 'Dark mode',
    description: 'Tema claro ou escuro, com preferência salva no navegador.',
  },
  {
    icon: 'article',
    title: 'Artigos e contribuição',
    description:
      'Leia artigos educativos por feriado e envie sugestões pelo site, sem precisar de GitHub.',
  },
];

export const ABOUT_USEFUL_LINKS: AboutUsefulLink[] = [
  {
    href: '/guia/',
    title: 'Guias de feriados',
    description: 'Calendário, dias úteis, facultativos, emendas e datas móveis.',
  },
  {
    href: '/privacidade/',
    title: 'Política de privacidade',
    description: 'Como tratamos cookies, geolocalização e dados do formulário de contribuição.',
  },
  {
    href: '/llms.txt',
    title: 'Índice para IA',
    description: 'Resumo estruturado do site para assistentes e mecanismos de busca.',
    external: true,
  },
];

export function getAboutFaqItems(siteUrl: string, githubUrl: string): FaqItem[] {
  return [
    {
      question: 'O Feriados Brasil é gratuito?',
      answer:
        'Sim. O site é 100% gratuito, sem cadastro e sem paywall. Você pode consultar feriados, ler artigos e usar o calendário livremente.',
    },
    {
      question: 'De onde vêm os dados de feriados?',
      answer:
        'Os feriados estão em arquivos JSON versionados no repositório do projeto, com base em leis, decretos e fontes oficiais. Não há API externa em tempo de execução — tudo é gerado estaticamente no build.',
    },
    {
      question: 'Posso contribuir sem saber programar?',
      answer:
        'Sim. Use o botão "Faltou algum feriado?" no rodapé ou nesta página para sugerir datas ou correções. Desenvolvedores podem abrir issues ou pull requests no GitHub.',
    },
    {
      question: 'O projeto é open source?',
      answer: `Sim. O código está sob licença MIT no GitHub (${githubUrl}) e aceita contribuições de dados, interface e documentação.`,
    },
    {
      question: 'Como o site trata meus dados?',
      answer: `Coletamos apenas o necessário: preferências locais (tema e localização), geolocalização opcional e cookies de análise somente com seu consentimento. Detalhes completos em ${siteUrl}/privacidade/.`,
    },
  ];
}

export function getAuthorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export const AUTHOR_STACK = ['Astro', 'React', 'Tailwind', 'TypeScript'] as const;
