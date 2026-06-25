import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HOLIDAYS_DIR = path.join(ROOT, 'src/data/holidays');
const ARTICLES_DIR = path.join(ROOT, 'src/data/articles');

function walkJsonFiles(directory) {
  const entries = [];
  for (const entry of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      entries.push(...walkJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      entries.push(fullPath);
    }
  }
  return entries;
}

function collectHolidays() {
  const map = new Map();

  for (const file of walkJsonFiles(HOLIDAYS_DIR)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const holidays = Array.isArray(data) ? data : data.holidays ?? [];
    const placeName = data.name;
    const uf = data.uf;
    const slug = data.slug;

    for (const holiday of holidays) {
      if (!map.has(holiday.id)) {
        map.set(holiday.id, {
          ...holiday,
          contexts: [],
        });
      }
      map.get(holiday.id).contexts.push({
        type: holiday.type,
        placeName,
        uf,
        slug,
        file: path.relative(ROOT, file),
      });
    }
  }

  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const DEFAULT_IMAGE = {
  src: '_default.svg',
  alt: 'Ilustração de calendário com destaque ao Brasil',
  credit: 'Ilustração Feriados Brasil',
};

const PLANALTO = {
  label: 'Presidência da República — Planalto',
  url: 'https://www.gov.br/planalto',
};

function article(base) {
  return {
    image: DEFAULT_IMAGE,
    sources: [PLANALTO],
    ...base,
  };
}

const CUSTOM = {
  'confraternizacao-universal': article({
    lead: 'A Confraternização Universal, celebrada em 1º de janeiro, marca a virada do ano e simboliza renovação, encontros familiares e a esperança de um novo ciclo no calendário brasileiro.',
    legalBasis:
      'Feriado nacional previsto na legislação trabalhista brasileira e consolidado no calendário oficial de repouso remunerado, sendo um dos dias de maior impacto em transportes, comércio e serviços públicos.',
    history: [
      'A celebração do Ano-Novo remonta a tradições milenares de diferentes culturas, associadas ao solstício e, posteriormente, ao calendário gregoriano adotado no Brasil.',
      'No país, a data combina festas populares, fogos de artifício e rituais simbólicos como o uso de branco e as oferendas a Iemanjá em diversas cidades litorâneas.',
      'Para o planejamento de viagens e folgas, 1º de janeiro é uma das datas mais observadas em calendários corporativos e escolares.',
    ],
    traditions: [
      'Ceias de réveillon e festas na virada da noite.',
      'Resoluções de ano novo e encontros com família e amigos.',
      'Grandes shows e queima de fogos em capitais e destinos turísticos.',
    ],
    funFacts: [
      'Em muitas praias brasileiras, flores e velas são levadas ao mar em homenagem a Iemanjá na virada.',
      'É um dos feriados com maior movimento em aeroportos e rodovias do ano.',
    ],
  }),
  'carnaval-segunda': article({
    lead: 'A segunda-feira de Carnaval é feriado facultativo nacional, marcando o auge da maior festa popular do Brasil antes da Quaresma.',
    legalBasis:
      'Ponto facultativo previsto em normas federais; a suspensão de expediente depende de ato do empregador ou de legislação local.',
    history: [
      'O Carnaval tem origem em festividades europeias que, no Brasil, incorporaram ritmos afro-brasileiros, samba, blocos de rua e escolas de samba.',
      'A segunda-feira integra o par de dias centrais da folia, quando desfiles, trios elétricos e festas atingem maior intensidade.',
      'Datas móveis calculadas a partir da Páscoa: ocorre 48 dias antes do domingo de Páscoa.',
    ],
    traditions: [
      'Blocos de rua e camarotes em grandes cidades.',
      'Desfiles de escolas de samba em sambódromos.',
      'Fantasias, marchinhas e celebrações em todo o território nacional.',
    ],
    funFacts: [
      'O frevo de Pernambuco e o axé da Bahia mostram como o Carnaval muda de ritmo conforme a região.',
      'Algumas empresas concedem folga apenas na terça, outras em ambos os dias.',
    ],
  }),
  'carnaval-terca': article({
    lead: 'A terça-feira de Carnaval encerra o período mais intenso da folia no Brasil, também como feriado facultativo nacional.',
    legalBasis:
      'Assim como a segunda-feira, trata-se de ponto facultativo de abrangência nacional, sem obrigatoriedade de paralisação para todos os setores.',
    history: [
      'Historicamente, a terça-feira concentra desfiles principais em cidades como Rio de Janeiro e São Paulo.',
      'A data é definida 47 dias antes da Páscoa, seguindo o calendário litúrgico cristão.',
      'Após a meia-noite de quarta-feira de Cinzas inicia-se simbolicamente a Quaresma.',
    ],
    traditions: [
      'Último dia de grande festa antes da Quaresma em muitas tradições católicas.',
      'Desfiles finais e encerramento de blocos em diversas capitais.',
    ],
    funFacts: [
      'Em algumas cidades do interior, a terça é ainda mais movimentada que a segunda.',
      'O impacto econômico do Carnaval envolve turismo, hotelaria e cultura em escala nacional.',
    ],
  }),
  'quarta-cinzas': article({
    lead: 'A Quarta-feira de Cinzas abre a Quaresma no calendário cristão e é ponto facultativo nacional, muitas vezes observado como meio expediente.',
    legalBasis: 'Facultativo nacional; empresas e órgãos públicos podem adotar suspensão parcial ou integral conforme regulamento interno.',
    history: [
      'A marcação de cinzas remete à penitência e reflexão, contrapondo-se ao excesso simbólico do Carnaval.',
      'No Brasil, muitos trabalhadores retornam às atividades ainda no período da manhã após festas prolongadas.',
      'Cai 46 dias antes da Páscoa.',
    ],
    traditions: ['Missas com imposição de cinzas na tradição católica.', 'Retomada gradual das atividades escolares e corporativas.'],
    funFacts: [
      'O nome vem do ritual em que cinzas são colocadas na testa dos fiéis.',
      'É comum haver trânsito intenso no retorno de viagens de Carnaval.',
    ],
  }),
  'sexta-santa': article({
    lead: 'A Sexta-feira Santa recorda a crucifixão de Jesus Cristo e é feriado nacional obrigatório de forte presença cultural e religiosa no Brasil.',
    legalBasis: 'Feriado nacional previsto na Lei nº 605/1949 e demais normas que compõem o calendário oficial brasileiro.',
    history: [
      'Integra a Semana Santa, período central do cristianismo, com procissões e liturgias em todo o país.',
      'A data é móvel: sempre dois dias antes do domingo de Páscoa.',
      'Historicamente influencia costumes de respeito, silêncio em parte das celebrações e restrições de entretenimento em algumas localidades.',
    ],
    traditions: [
      'Procissões do Senhor Morto e encenações da Paixão de Cristo.',
      'Prática de jejum ou abstinência para muitos cristãos.',
      'Programação especial em templos religiosos.',
    ],
    funFacts: [
      'É uma das poucas datas móveis com status de feriado nacional obrigatório.',
      'Em várias cidades, teatros e casas noturnas reduzem atividades por tradição local.',
    ],
  }),
  pascoa: article({
    lead: 'A Páscoa celebra a ressurreição de Jesus Cristo e estrutura o calendário móvel de diversos feriados brasileiros, embora o domingo em si não seja feriado civil.',
    legalBasis:
      'Data religiosa central do cristianismo; no calendário civil brasileiro, serve de referência para Carnaval, Corpus Christi e outras datas móveis.',
    history: [
      'O cálculo da Páscoa no calendário ocidental segue o algoritmo de Meeus/Jones/Butcher, adotado para determinar o domingo após a primeira lua cheia da primavera no hemisfério norte.',
      'No Brasil, a data combina celebrações religiosas com comércio de chocolates e encontros familiares.',
      'Muitos feriados nacionais e facultativos dependem diretamente desta data.',
    ],
    traditions: [
      'Missas e celebrações nas denominações cristãs.',
      'Troca de ovos de Páscoa e refeições em família.',
    ],
    funFacts: [
      'A Páscoa pode ocorrer entre 22 de março e 25 de abril.',
      'É a âncora matemática de boa parte do calendário móvel brasileiro.',
    ],
  }),
  tiradentes: article({
    lead: 'O feriado de Tiradentes, em 21 de abril, homenageia Joaquim José da Silva Xavier, mártir da Inconfidência Mineira e patrono cívico da República.',
    legalBasis: 'Feriado nacional instituído pela Lei nº 662/1949, em memória da execução de Tiradentes em 1792.',
    history: [
      'A Inconfidência Mineira (1789) foi um movimento de crítica ao domínio português e às metas de cobrança fiscal na Capitania de Minas Gerais.',
      'Tiradentes tornou-se símbolo de resistência e, posteriormente, de valores republicanos no imaginário nacional.',
      'A data foi consolidada como feriado após o período republicano, reforçando a educação cívica.',
    ],
    traditions: [
      'Cerimônias em praças públicas e escolas.',
      'Desfiles cívicos em diversas cidades.',
    ],
    funFacts: [
      'O apelido Tiradentes vem de sua atuação como dentista que arrancava dentes.',
      'Em Brasília, a data coincide com o aniversário da cidade em algumas interpretações simbólicas do calendário.',
    ],
  }),
  'dia-do-trabalho': article({
    lead: 'O Dia do Trabalho, em 1º de maio, celebra as conquistas laborais e a importância dos trabalhadores na construção da sociedade brasileira.',
    legalBasis: 'Feriado nacional de 1º de maio, reconhecido na legislação brasileira e alinhado à tradição internacional do trabalho.',
    history: [
      'A data remete ao movimento operário do século XIX e à luta por jornadas mais justas de trabalho.',
      'No Brasil, tornou-se feriado com forte presença de atos sindicais, manifestações e debates sobre direitos trabalhistas.',
      'É marco para reflexão sobre emprego, renda e políticas públicas.',
    ],
    traditions: [
      'Eventos de centrais sindicais em capitais.',
      'Descanso remunerado para trabalhadores com vínculo regido pela CLT.',
    ],
    funFacts: [
      'É celebrado em dezenas de países como Dia Internacional dos Trabalhadores.',
      'Muitas cidades registram trânsito mais leve em centros comerciais.',
    ],
  }),
  'corpus-christi': article({
    lead: 'Corpus Christi é feriado facultativo nacional dedicado à festa do Santíssimo Sacramento na tradição católica, celebrada 60 dias após a Páscoa.',
    legalBasis: 'Ponto facultativo nacional; a adoção da folga varia entre União, estados, municípios e empresas privadas.',
    history: [
      'A festa surgiu na Europa medieval e se consolidou no Brasil com procissões e tapetes de serragem colorida.',
      'Em muitas cidades do interior, é uma das manifestações religiosas populares mais visíveis do ano.',
      'A data móvel favorece longos fins de semana quando combinada com pontos facultativos locais.',
    ],
    traditions: [
      'Procissões com tapetes artesanais nas ruas.',
      'Missas solenes em paróquias católicas.',
    ],
    funFacts: [
      'Tapetes de Corpus Christi são patrimônio cultural em cidades como Santana de Parnaíba (SP) e Olinda (PE).',
      'Sempre cai em uma quinta-feira.',
    ],
  }),
  independencia: article({
    lead: 'O Dia da Independência, em 7 de setembro, marca a separação do Brasil de Portugal e é um dos feriados nacionais mais emblemáticos.',
    legalBasis: 'Feriado nacional previsto na Lei nº 662/1949, em memória da proclamação às margens do rio Ipiranga em 1822.',
    history: [
      'Dom Pedro I proclamou a independência em São Paulo, consolidando processo político que transformou a colônia em Império.',
      'A data reforça símbolos como a bandeira verde e amarela, desfiles cívicos e narrativas de soberania.',
      'Ao longo do século XX, tornou-se feriado com forte presença escolar e militar.',
    ],
    traditions: [
      'Desfiles cívico-militares em Brasília e capitais.',
      'Apresentações escolares e hasteamento da bandeira.',
    ],
    funFacts: [
      'O Grito do Ipiranga é retratado em pinturas e monumentos espalhados pelo país.',
      '7 de setembro costuma concentrar eventos oficiais de alto público.',
    ],
  }),
  'nossa-senhora-aparecida': article({
    lead: 'O dia de Nossa Senhora Aparecida, em 12 de outubro, celebra a padroeira do Brasil e é feriado nacional de expressiva devoção popular.',
    legalBasis: 'Feriado nacional instituído pela Lei nº 6.802/1980, reconhecendo a padroeira oficial do país.',
    history: [
      'A devoção remete à tradicional narrativa da imagem encontrada no Rio Paraíba do Sul, em 1717.',
      'O Santuário Nacional em Aparecida (SP) tornou-se um dos maiores centros de peregrinação da América Latina.',
      'A data também se relaciona culturalmente com o Dia das Crianças no calendário brasileiro.',
    ],
    traditions: [
      'Romarias e missas no Santuário de Aparecida.',
      'Procissões e festas paroquiais em todo o território nacional.',
    ],
    funFacts: [
      'Milhões de pessoas visitam Aparecida no período da festa.',
      'É um dos feriados religiosos de maior adesão popular no Brasil.',
    ],
  }),
  finados: article({
    lead: 'O Dia de Finados, em 2 de novembro, dedica-se à memória dos que já partiram e combina tradição católica com costumes brasileiros de visita aos cemitérios.',
    legalBasis: 'Feriado nacional previsto na Lei nº 662/1949, ligado ao calendário católico de homenagem aos fiéis defuntos.',
    history: [
      'A celebração remonta à prática medieval de orações pelos mortos, incorporada ao calendário colonial brasileiro.',
      'No país, a data reforça laços familiares e rituais de cuidado com túmulos e mausoléus.',
      'É feriado de reflexão, com menor presença de festividades comerciais em comparação a outras datas.',
    ],
    traditions: [
      'Visitas a cemitérios com flores e velas.',
      'Missas de finados em comunidades religiosas.',
    ],
    funFacts: [
      'Flores e cânticos populares marcam o dia em cemitérios urbanos e rurais.',
      'Costuma haver trânsito intenso nos acessos a cemitérios nas manhãs do feriado.',
    ],
  }),
  'proclamacao-republica': article({
    lead: 'Em 15 de novembro, o Brasil celebra a Proclamação da República, marco de 1889 que encerrou o Império e inaugurou o regime republicano.',
    legalBasis: 'Feriado nacional estabelecido pela Lei nº 662/1949, em memória do golpe republicano liderado por militares e civis no Rio de Janeiro.',
    history: [
      'A deposição de Dom Pedro II respondeu a tensões políticas do Segundo Reinado, incluindo questões escravistas, militares e econômicas.',
      'A República Velha estruturou novo ordenamento institucional com Constituição de 1891.',
      'A data é lembrada em contextos educativos sobre democracia e cidadania.',
    ],
    traditions: [
      'Atividades cívicas em escolas e praças públicas.',
      'Debates históricos sobre república e participação popular.',
    ],
    funFacts: [
      'A Proclamação ocorreu no Campo de Santana, no Rio de Janeiro.',
      'A bandeira republicana substituiu progressivamente símbolos monárquicos.',
    ],
  }),
  'consciencia-negra': article({
    lead: 'O Dia da Consciência Negra, em 20 de novembro, homenageia Zumbi dos Palmares e reforça a luta antirracista e a valorização da cultura afro-brasileira.',
    legalBasis: 'Feriado nacional instituído pela Lei nº 14.759/2023, com vigência a partir de 2024 em todo o território brasileiro.',
    history: [
      'A data remete à morte de Zumbi, em 1695, símbolo de resistência negra contra a escravidão.',
      'Antes de ser nacional, a data já era feriado em diversos estados e municípios.',
      'A ampliação para feriado nacional representou reconhecimento político da pauta antirracista.',
    ],
    traditions: [
      'Roda de samba, capoeira e eventos culturais afro-brasileiros.',
      'Debates educativos sobre racismo estrutural e equidade.',
    ],
    funFacts: [
      '20 de novembro já era amplamente celebrado em cidades com forte presença afro-brasileira.',
      'É um dos feriados nacionais mais recentes do calendário oficial.',
    ],
  }),
  natal: article({
    lead: 'O Natal, em 25 de dezembro, celebra o nascimento de Jesus Cristo e é um dos feriados mais aguardados do calendário brasileiro.',
    legalBasis: 'Feriado nacional cristão consolidado historicamente no calendário brasileiro e reconhecido como dia de repouso remunerado.',
    history: [
      'A festividade combina raízes religiosas com tradições populares como ceias, presépios e troca de presentes.',
      'No Brasil, o período é marcado por festas familiares, decorações luminosas e campanhas solidárias.',
      'O clima tropical adaptou costumes europeus a praias, churrascos e viagens de fim de ano.',
    ],
    traditions: [
      'Ceia de Natal na noite de 24 ou almoço no dia 25.',
      'Montagem de árvores de Natal e presépios.',
      'Missas do Galo em comunidades católicas.',
    ],
    funFacts: [
      'O comércio de Natal movimenta bilhões na economia brasileira todos os anos.',
      'É feriado simultâneo em grande parte dos países cristãos.',
    ],
  }),
  'revolucao-farroupilha': article({
    lead: 'A Revolução Farroupilha, celebrada em 20 de setembro no Rio Grande do Sul, marca o início do movimento separatista de 1835 que moldou a identidade gaúcha.',
    legalBasis: 'Feriado estadual no Rio Grande do Sul, previsto na legislação estadual que reconhece a data como repouso obrigatório.',
    history: [
      'O levante surgiu de tensões entre farrapos e imperiais, envolvendo economia charqueira, autonomia regional e conflitos fiscais.',
      'Durou cerca de uma década e terminou com acordo que preservou o Rio Grande do Sul no Império.',
      'Tornou-se símbolo de orgulho regional e memória histórica gaúcha.',
    ],
    traditions: [
      'Desfiles tradicionalistas e cavalgadas.',
      'Uso de trajes gaúchos e chimarrão em celebrações públicas.',
    ],
    funFacts: [
      'No mesmo dia também se celebra o Dia do Gaúcho no estado.',
      'O movimento inspirou literatura, música e folclore regional.',
    ],
    sources: [{ label: 'Governo do Rio Grande do Sul', url: 'https://www.estado.rs.gov.br' }, PLANALTO],
  }),
  'dia-do-gaucho': article({
    lead: 'O Dia do Gaúcho, em 20 de setembro, celebra a cultura, os costumes e a identidade do povo gaúcho no Rio Grande do Sul.',
    legalBasis: 'Data de celebração cultural associada ao feriado estadual da Revolução Farroupilha no RS.',
    history: [
      'A data reforça tradições campeiras, música nativista e valores associados ao campo gaúcho.',
      'Ganhou visibilidade junto à memória da Revolução Farroupilha.',
      'É marcada por eventos folclóricos em cidades de todo o estado.',
    ],
    traditions: ['Acampamentos farroupilhas e rodeios culturais.', 'Apresentações de música gaúcha e danças tradicionais.'],
    funFacts: [
      'O chimarrão e o bombacha são símbolos recorrentes nas celebrações.',
      'Muitas escolas promovem atividades sobre cultura regional nesta data.',
    ],
  }),
};

function placeFromContexts(holiday) {
  const municipal = holiday.contexts.find((ctx) => ctx.placeName && ctx.uf && ctx.slug);
  const state = holiday.contexts.find((ctx) => ctx.placeName && ctx.uf && !ctx.slug?.includes('-'));
  return municipal ?? state ?? holiday.contexts[0] ?? {};
}

function formatDate(holiday) {
  if (holiday.date) {
    const [month, day] = holiday.date.split('-');
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];
    return `${Number(day)} de ${months[Number(month) - 1]}`;
  }
  if (holiday.dateRule) return 'data móvel no calendário anual';
  return 'data definida no calendário local';
}

function generateMunicipalBirthday(holiday) {
  const ctx = placeFromContexts(holiday);
  const city = ctx.placeName ?? holiday.name.replace(/^Aniversário de /i, '');
  const uf = ctx.uf ?? 'BR';
  const dateText = formatDate(holiday);

  return article({
    lead: `${holiday.name} é feriado municipal em ${city}/${uf}, celebrado em ${dateText}, quando a cidade relembra sua história, identidade e conquistas coletivas.`,
    legalBasis: `Feriado municipal previsto na legislação de ${city}, integrando o calendário oficial de repouso do município.`,
    history: [
      `${holiday.description ?? 'A data marca a fundação ou emancipação política do município.'}`,
      `Em ${city}, o aniversário costuma mobilizar eventos culturais, shows e atividades cívicas que reforçam o orgulho local.`,
      'Feriados municipais variam conforme a legislação de cada prefeitura e podem coincidir com feriados estaduais ou nacionais.',
    ],
    traditions: [
      'Programação cultural em praças e centros de convivência.',
      'Hasteamento de bandeiras e cerimônias com autoridades locais.',
      'Promoções comerciais e feiras gastronômicas em diversas cidades.',
    ],
    funFacts: [
      `O feriado é válido no município de ${city}, não necessariamente em toda a unidade federativa.`,
      'Viajantes devem confirmar o calendário local ao planejar compromissos na cidade.',
    ],
    sources: [
      { label: `Prefeitura de ${city}`, url: 'https://www.gov.br' },
      PLANALTO,
    ],
  });
}

function generateStateCreation(holiday) {
  const ctx = placeFromContexts(holiday);
  const state = ctx.placeName ?? 'estado';
  const uf = ctx.uf ?? '';
  const dateText = formatDate(holiday);

  return article({
    lead: `${holiday.name} é feriado estadual em ${state}${uf ? ` (${uf})` : ''}, celebrado em ${dateText}, em memória de marco histórico da formação do estado.`,
    legalBasis: `Previsto na legislação estadual de ${state}, como parte do calendário de feriados locais.`,
    history: [
      holiday.description ?? 'A data remete a processo histórico de criação, emancipação ou organização política territorial.',
      'Feriados estaduais refletem narrativas regionais e identidade política de cada unidade federativa.',
      'No calendário nacional, convivem com feriados federais e municipais, exigindo atenção em planejamentos intermunicipais.',
    ],
    traditions: [
      'Cerimônias cívicas no palácio ou assembleia legislativa estadual.',
      'Eventos educativos em escolas públicas estaduais.',
    ],
    funFacts: [
      `${state} possui feriados próprios além do calendário nacional.`,
      'Empresas com atuação interestadual costumam observar feriados conforme local de trabalho.',
    ],
  });
}

function generatePatronSaint(holiday) {
  const ctx = placeFromContexts(holiday);
  const place = ctx.placeName ?? 'região';
  const uf = ctx.uf ?? '';
  const dateText = formatDate(holiday);

  return article({
    lead: `${holiday.name} é feriado em ${place}${uf ? `/${uf}` : ''}, celebrado em ${dateText}, com forte tradição religiosa e cultural.`,
    legalBasis: `Feriado previsto na legislação estadual ou municipal de ${place}, associado à devoção da santa padroeira.`,
    history: [
      holiday.description ?? 'A celebração combina fé católica, festas populares e memória histórica local.',
      'Padroeiras e santos patronos estruturam calendários religiosos que influenciaram feriados civis em diversas regiões.',
      'Procissões e novenas antecedem a data em muitas comunidades.',
    ],
    traditions: [
      'Missas solenes e procissões nas ruas centrais.',
      'Feiras populares com comidas típicas e apresentações culturais.',
    ],
    funFacts: [
      'Feriados religiosos locais atraem fiéis e turistas em cidades históricas.',
      'A devoção costuma se manifestar em arte sacra, música e literatura regional.',
    ],
  });
}

function generateGeneric(holiday) {
  const ctx = placeFromContexts(holiday);
  const place = ctx.placeName;
  const uf = ctx.uf;
  const scope =
    holiday.type === 'national'
      ? 'Brasil'
      : holiday.type === 'state' || holiday.type === 'state_optional'
        ? `${place ?? 'estado'}${uf ? ` (${uf})` : ''}`
        : `${place ?? 'município'}${uf ? `/${uf}` : ''}`;
  const dateText = formatDate(holiday);
  const optionalNote =
    holiday.type === 'optional' || holiday.type === 'state_optional'
      ? 'Trata-se de feriado facultativo, cuja observância depende de regulamento do empregador ou do ente público.'
      : 'É feriado obrigatório em seu âmbito de abrangência territorial.';

  return article({
    lead: `${holiday.name} é celebrado em ${dateText} em ${scope}. ${holiday.description ?? 'Data de relevância histórica, cultural ou religiosa no calendário brasileiro.'}`,
    legalBasis: `${optionalNote} Previsto no calendário oficial aplicável a ${scope}.`,
    history: [
      holiday.description ?? 'A data preserva memória coletiva e identidade regional ou nacional.',
      'Feriados brasileiros resultam da combinação entre tradição religiosa, marcos históricos e legislação federal, estadual e municipal.',
      'Para viagens e operações comerciais, é essencial verificar o alcance territorial do feriado.',
    ],
    traditions: [
      'Cerimônias oficiais e atividades educativas em escolas.',
      'Eventos culturais abertos à comunidade.',
    ],
    funFacts: [
      'O Brasil possui um dos calendários de feriados mais complexos das grandes economias, pela sobreposição de níveis federativos.',
      'Datas fixas facilitam planejamento; datas móveis exigem cálculo anual.',
    ],
  });
}

function buildArticle(holiday) {
  if (CUSTOM[holiday.id]) return { id: holiday.id, ...CUSTOM[holiday.id] };

  if (holiday.id.startsWith('aniversario-')) return { id: holiday.id, ...generateMunicipalBirthday(holiday) };
  if (holiday.id.startsWith('criacao-')) return { id: holiday.id, ...generateStateCreation(holiday) };
  if (holiday.id.startsWith('padroeira-')) return { id: holiday.id, ...generatePatronSaint(holiday) };
  if (holiday.id.startsWith('emancipacao-')) return { id: holiday.id, ...generateStateCreation(holiday) };
  if (holiday.id.startsWith('sao-joao-')) return { id: holiday.id, ...generateGeneric(holiday) };

  return { id: holiday.id, ...generateGeneric(holiday) };
}

function main() {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const holidays = collectHolidays();

  for (const holiday of holidays) {
    const articleData = buildArticle(holiday);
    const filePath = path.join(ARTICLES_DIR, `${holiday.id}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(articleData, null, 2)}\n`, 'utf8');
  }

  console.log(`Gerados ${holidays.length} artigos em ${ARTICLES_DIR}`);
}

main();
