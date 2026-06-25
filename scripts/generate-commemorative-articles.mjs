import fs from 'node:fs';
import path from 'node:path';

const ARTICLES_DIR = path.join(process.cwd(), 'src/data/articles');

const articles = [
  {
    id: 'dia-da-mulher',
    lead: 'O Dia Internacional da Mulher, em 8 de março, celebra conquistas sociais e reforça a luta por igualdade, respeito e direitos para todas as mulheres.',
    history: [
      'A data remonta a movimentações trabalhistas do início do século XX e ganhou projeção internacional ao longo das décadas.',
      'No Brasil, 8 de março é marcado por debates sobre igualdade salarial, representatividade política e combate à violência de gênero.',
      'Empresas, sindicatos e organizações sociais promovem eventos de conscientização e homenagens.',
    ],
    traditions: ['Marchas e atos públicos em capitais.', 'Campanhas nas redes sociais e na mídia.'],
    funFacts: ['Não é feriado nacional, mas é uma das datas comemorativas mais reconhecidas do calendário.'],
    wiki: 'Dia Internacional das Mulheres',
  },
  {
    id: 'dia-da-mentira',
    lead: 'O Dia da Mentira, em 1º de abril, é tradicionalmente marcado por brincadeiras leves, pegadinhas e humor entre amigos, familiares e colegas.',
    history: [
      'A tradição tem versões históricas na Europa e se popularizou no Brasil pela mídia e pela cultura popular.',
      'Jornais e programas de TV já publicaram notícias fictícias como parte da brincadeira.',
      'A data não possui caráter oficial, mas faz parte do calendário cultural brasileiro.',
    ],
    traditions: ['Pegadinhas entre conhecidos.', 'Notícias humorísticas em veículos de comunicação.'],
    funFacts: ['Também é conhecido internacionalmente como April Fools\' Day.'],
    wiki: 'Dia da Mentira',
  },
  {
    id: 'dia-do-indio',
    lead: 'O Dia do Índio, em 19 de abril, homenageia os povos indígenas e reforça a importância de preservar culturas, línguas e territórios originários.',
    history: [
      'A data foi instituída em referência ao cacique Maringá e ganhou força com o movimento indigenista no Brasil.',
      'Escolas, museus e órgãos públicos promovem atividades educativas sobre a diversidade indígena.',
      'É um marco para debates sobre demarcação de terras e direitos fundamentais.',
    ],
    traditions: ['Eventos culturais em aldeias e instituições.', 'Atividades pedagógicas sobre povos originários.'],
    funFacts: ['O Brasil possui mais de 300 etnias indígenas reconhecidas.'],
    wiki: 'Dia do Índio',
  },
  {
    id: 'dia-da-terra',
    lead: 'O Dia da Terra, em 22 de abril, mobiliza reflexões sobre meio ambiente, mudanças climáticas e responsabilidade coletiva com o planeta.',
    history: [
      'Criado nos Estados Unidos em 1970, o Dia da Terra se espalhou pelo mundo como símbolo ambiental.',
      'No Brasil, a data reforça debates sobre desmatamento, recursos hídricos e cidades sustentáveis.',
      'Escolas e ONGs costumam organizar mutirões de limpeza e plantio de árvores.',
    ],
    traditions: ['Campanhas de conscientização ambiental.', 'Ações de reflorestamento e educação ecológica.'],
    funFacts: ['Costuma coincidir com a Semana Nacional do Meio Ambiente em muitas cidades.'],
    wiki: 'Dia da Terra',
  },
  {
    id: 'dia-das-maes',
    lead: 'O Dia das Mães, celebrado no segundo domingo de maio, é uma das datas comemorativas mais importantes do Brasil para homenagear as mães.',
    history: [
      'A tradição brasileira se consolidou no século XX com forte apelo comercial e familiar.',
      'Restaurantes, shoppings e o comércio em geral registram alto movimento na data.',
      'Também inspira homenagens em escolas, igrejas e redes sociais.',
    ],
    traditions: ['Presentes, cartões e refeições em família.', 'Homenagens em escolas e comunidades religiosas.'],
    funFacts: ['É considerada uma das datas de maior consumo no varejo brasileiro.'],
    wiki: 'Dia das Mães',
  },
  {
    id: 'dia-da-familia',
    lead: 'O Dia Internacional da Família, em 15 de maio, destaca a importância dos laços familiares e do apoio mútuo entre gerações.',
    history: [
      'Proclamado pela ONU em 1993, o dia reforça o papel da família na formação social.',
      'No Brasil, a data é lembrada em escolas, instituições religiosas e campanhas públicas.',
      'Promove reflexões sobre acolhimento, diversidade familiar e cuidado intergeracional.',
    ],
    traditions: ['Atividades escolares sobre convivência familiar.', 'Campanhas de conscientização em saúde e educação.'],
    funFacts: ['Não é ponto facultativo nem feriado nacional.'],
    wiki: 'Dia Internacional da Família',
  },
  {
    id: 'dia-do-meio-ambiente',
    lead: 'O Dia Mundial do Meio Ambiente, em 5 de junho, foi criado pela ONU para estimular ações em defesa do planeta e dos ecossistemas.',
    history: [
      'Celebrado desde 1972, após a Conferência de Estocolmo sobre o meio humano.',
      'No Brasil, a data dialoga com a Lei do Meio Ambiente e políticas de sustentabilidade.',
      'Governos e organizações promovem seminários, mutirões e campanhas educativas.',
    ],
    traditions: ['Palestras e eventos ambientais.', 'Ações de coleta seletiva e educação ecológica.'],
    funFacts: ['Cada edição costuma ter um tema oficial definido pelo Programa das Nações Unidas para o Meio Ambiente.'],
    wiki: 'Dia Mundial do Meio Ambiente',
  },
  {
    id: 'dia-dos-namorados',
    lead: 'O Dia dos Namorados, em 12 de junho, é a principal data brasileira para celebrar o amor romântico, com inspiração em Santo Antônio, padroeiro dos casamentos.',
    history: [
      'A data foi impulsionada pelo comércio a partir da década de 1940 e consolidada nacionalmente nas décadas seguintes.',
      'Diferente do Valentine\'s Day (14 de fevereiro), o Brasil concentra a celebração em junho.',
      'Restaurantes, floriculturas e lojas registram um dos picos anuais de vendas.',
    ],
    traditions: ['Troca de presentes, jantares e mensagens afetivas.', 'Promoções comerciais em todo o país.'],
    funFacts: ['12 de junho é véspera do dia de Santo Antônio na tradição católica.'],
    wiki: 'Dia dos Namorados',
  },
  {
    id: 'dia-de-sao-joao',
    lead: 'O Dia de São João, em 24 de junho, marca o ápice das festas juninas no Brasil, com fogueiras, quadrilhas, comidas típicas e celebrações populares.',
    history: [
      'As festas juninas têm raízes europeias e se mesclaram com a cultura nordestina e brasileira.',
      'São João é um dos santos mais associados às celebrações de junho, junto a Santo Antônio e São Pedro.',
      'Cidades do interior e capitais promovem arraiais, festas públicas e eventos culturais.',
    ],
    traditions: ['Quadrilhas, fogueiras, milho, pé-de-moleque e canjica.', 'Festas públicas em praças e escolas.'],
    funFacts: ['Em muitas regiões, as festas juninas se estendem por todo o mês de junho.'],
    wiki: 'Festa junina',
  },
  {
    id: 'dia-do-amigo',
    lead: 'O Dia do Amigo, em 20 de julho, celebra as amizades e a importância das relações de afeto fora do núcleo familiar e romântico.',
    history: [
      'A data ganhou popularidade no Brasil a partir da década de 1980, inspirada em experiências argentinas.',
      'Redes sociais ampliaram as homenagens com mensagens, encontros e celebrações.',
      'Bares, restaurantes e eventos temáticos costumam oferecer promoções na data.',
    ],
    traditions: ['Encontros entre amigos e jantares coletivos.', 'Mensagens e publicações nas redes sociais.'],
    funFacts: ['No Brasil, 20 de julho é mais celebrado que o Dia da Amizade internacional em 30 de julho.'],
    wiki: 'Dia do Amigo',
  },
  {
    id: 'dia-dos-avos',
    lead: 'O Dia dos Avós, em 26 de julho, homenageia avós e avôs, reconhecendo seu papel afetivo e educativo na formação das famílias.',
    history: [
      'A data foi criada em referência à festa católica de Sant\'Ana e São Joaquim, pais de Maria.',
      'Escolas e famílias promovem atividades para aproximar crianças e idosos.',
      'Também reforça debates sobre envelhecimento ativo e qualidade de vida na terceira idade.',
    ],
    traditions: ['Homenagens em escolas e asilos.', 'Encontros familiares com cartões e presentes simbólicos.'],
    funFacts: ['Costuma ser celebrado junto com o Dia dos Avós em outros países em datas distintas.'],
    wiki: 'Dia dos Avós',
  },
  {
    id: 'dia-do-estudante',
    lead: 'O Dia do Estudante, em 11 de agosto, lembra a luta estudantil brasileira e valoriza o papel da educação na formação cidadã.',
    history: [
      'A data remete ao Massacre da Praça da Sé, em 1937, quando estudantes foram reprimidos em São Paulo.',
      'Universidades, escolas e entidades estudantis promovem debates sobre educação pública.',
      'É símbolo da participação da juventude na história política do país.',
    ],
    traditions: ['Eventos acadêmicos e culturais em instituições de ensino.', 'Homenagens a estudantes e educadores.'],
    funFacts: ['Não confundir com o Dia Nacional do Estudante, em 11 de novembro, de origem distinta.'],
    wiki: 'Dia do Estudante',
  },
  {
    id: 'dia-dos-pais',
    lead: 'O Dia dos Pais, no segundo domingo de agosto, homenageia os pais e figuras paternas, sendo uma das datas comemorativas mais populares do Brasil.',
    history: [
      'Inspirado na tradição norte-americana, consolidou-se no Brasil a partir da década de 1950.',
      'O comércio de presentes, eletrônicos, roupas e experiências cresce significativamente na semana da data.',
      'Famílias costumam reunir-se para refeições e homenagens afetivas.',
    ],
    traditions: ['Presentes e almoços em família.', 'Homenagens em escolas e clubes.'],
    funFacts: ['É o equivalente masculino do Dia das Mães no calendário comercial brasileiro.'],
    wiki: 'Dia dos Pais',
  },
  {
    id: 'dia-do-folclore',
    lead: 'O Dia do Folclore, em 22 de agosto, celebra as manifestações culturais populares, lendas, danças e tradições que formam a identidade brasileira.',
    history: [
      'Instituído em homenagem a Lourenço Dias, pesquisador de cultura popular, e à rica diversidade folclórica do país.',
      'Escolas e centros culturais promovem apresentações de boi-bumbá, frevo, cuca e outras expressões regionais.',
      'A data reforça a importância de preservar o patrimônio imaterial.',
    ],
    traditions: ['Apresentações folclóricas em escolas e praças.', 'Exposições sobre lendas e tradições regionais.'],
    funFacts: ['O Brasil possui manifestações folclóricas distintas em cada região do país.'],
    wiki: 'Folclore do Brasil',
  },
  {
    id: 'dia-do-cliente',
    lead: 'O Dia do Cliente, em 15 de setembro, reconhece a importância do consumidor e costuma ser marcado por promoções e campanhas comerciais.',
    history: [
      'A data surgiu no Brasil como estratégia do varejo para fidelizar consumidores.',
      'Lojas físicas e e-commerce oferecem descontos, brindes e condições especiais.',
      'Também dialoga com o Código de Defesa do Consumidor e os direitos do consumidor.',
    ],
    traditions: ['Liquidações e promoções no comércio.', 'Campanhas de relacionamento de marcas com clientes.'],
    funFacts: ['É uma das datas favoritas do varejo online no Brasil.'],
    wiki: 'Dia do Cliente',
  },
  {
    id: 'dia-da-arvore',
    lead: 'O Dia da Árvore, em 21 de setembro, destaca a importância das árvores para o meio ambiente, o clima e a qualidade de vida nas cidades.',
    history: [
      'A data foi proposta por pioneiros ambientalistas no Brasil no início do século XX.',
      'Prefeituras e ONGs promovem plantios urbanos e educação ambiental.',
      'Reforça a conexão entre arborização, sombra, biodiversidade e saúde pública.',
    ],
    traditions: ['Mutirões de plantio de mudas.', 'Atividades educativas em escolas e parques.'],
    funFacts: ['Antecede a primavera no hemisfério sul, reforçando o simbolismo de renovação.'],
    wiki: 'Dia da Árvore',
  },
  {
    id: 'dia-do-idoso',
    lead: 'O Dia do Idoso, em 1º de outubro, homenageia pessoas idosas e promove reflexões sobre envelhecimento digno, saúde e inclusão social.',
    history: [
      'A data coincide com o Dia Internacional do Idoso, instituído pela ONU.',
      'No Brasil, dialoga com o Estatuto do Idoso e políticas de atenção à terceira idade.',
      'Instituições promovem eventos sobre direitos, lazer e bem-estar da população idosa.',
    ],
    traditions: ['Atividades em centros de convivência e clubes da melhor idade.', 'Campanhas de saúde preventiva.'],
    funFacts: ['O Brasil possui parcela crescente da população com mais de 60 anos.'],
    wiki: 'Dia Internacional do Idoso',
  },
  {
    id: 'dia-das-criancas',
    lead: 'O Dia das Crianças, em 12 de outubro, celebra a infância no Brasil e coincide com o feriado de Nossa Senhora Aparecida.',
    history: [
      'A data foi impulsionada pelo comércio de brinquedos a partir da década de 1960.',
      'Escolas, shoppings e parques promovem atividades lúdicas para crianças.',
      'Também reforça debates sobre direitos da criança e proteção integral.',
    ],
    traditions: ['Presentes, festas escolares e eventos em shoppings.', 'Campanhas sobre direitos infantis.'],
    funFacts: ['12 de outubro também é feriado nacional por Nossa Senhora Aparecida.'],
    wiki: 'Dia das Crianças',
  },
  {
    id: 'dia-do-professor',
    lead: 'O Dia do Professor, em 15 de outubro, homenageia educadores e reconhece o papel da escola na formação de cidadãos.',
    history: [
      'A data remonta a homenagens a educadores no Brasil republicano e se consolidou no calendário escolar.',
      'Alunos costumam preparar homenagens, cartazes e apresentações para professores.',
      'Sindicatos e instituições de ensino debatem valorização da carreira docente.',
    ],
    traditions: ['Homenagens em escolas públicas e privadas.', 'Eventos culturais em instituições de ensino.'],
    funFacts: ['No calendário internacional, o Dia Mundial dos Professores é celebrado em 5 de outubro.'],
    wiki: 'Dia do Professor',
  },
  {
    id: 'dia-do-servidor-publico',
    lead: 'O Dia do Servidor Público, em 28 de outubro, reconhece profissionais que trabalham na administração pública federal, estadual e municipal.',
    history: [
      'A data foi estabelecida em referência à criação da Associação Brasileira de Servidores Públicos.',
      'Órgãos governamentais promovem eventos internos e campanhas de valorização.',
      'Também é momento de reflexão sobre eficiência e qualidade dos serviços públicos.',
    ],
    traditions: ['Cerimônias em órgãos públicos.', 'Homenagens a servidores destacados.'],
    funFacts: ['Em alguns estados e municípios, a data pode ser ponto facultativo para servidores locais.'],
    wiki: 'Servidor público',
  },
  {
    id: 'dia-da-bandeira',
    lead: 'O Dia da Bandeira, em 19 de novembro, homenageia o símbolo nacional brasileiro e o hino dedicado à bandeira verde e amarela.',
    history: [
      'Instituído em 1939, a data celebra a bandeira adotada na República e seu simbolismo histórico.',
      'Escolas realizam cerimônias de hasteamento e execução do Hino à Bandeira Nacional.',
      'Reforça o civismo e a identidade nacional em eventos oficiais.',
    ],
    traditions: ['Cerimônias cívicas em escolas.', 'Desfiles e eventos oficiais em algumas cidades.'],
    funFacts: ['O Hino à Bandeira Nacional tem letra de Olavo Bilac e música de Francisco Braga.'],
    wiki: 'Dia da Bandeira',
  },
  {
    id: 'combate-violencia-mulher',
    lead: 'O Dia Nacional de Combate à Violência contra a Mulher, em 25 de novembro, mobiliza a sociedade contra a violência de gênero e em memória de Maria da Penha.',
    history: [
      'A data foi instituída em referência ao caso de Maria da Penha, símbolo da luta contra a violência doméstica.',
      'Coincide com o Dia Internacional pela Eliminação da Violência contra as Mulheres, da ONU.',
      'Campanhas públicas reforçam canais de denúncia como o Ligue 180.',
    ],
    traditions: ['Marchas, palestras e campanhas de conscientização.', 'Iluminação de monumentos em cor lilás em várias cidades.'],
    funFacts: ['A Lei Maria da Penha (Lei 11.340/2006) é marco na proteção de mulheres no Brasil.'],
    wiki: 'Dia Internacional da Eliminação da Violência contra as Mulheres',
  },
];

for (const entry of articles) {
  const file = {
    id: entry.id,
    lead: entry.lead,
    history: entry.history,
    traditions: entry.traditions,
    funFacts: entry.funFacts,
    sources: [
      {
        label: 'Wikipédia em português',
        url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(entry.wiki.replace(/ /g, '_'))}`,
      },
    ],
  };
  fs.writeFileSync(
    path.join(ARTICLES_DIR, `${entry.id}.json`),
    `${JSON.stringify(file, null, 2)}\n`,
    'utf8',
  );
}

console.log(`Generated ${articles.length} commemorative articles.`);
