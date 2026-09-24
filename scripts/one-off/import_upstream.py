#!/usr/bin/env python3
"""
Importação única (v2.0.0) que gerou `data/seed/`.

Fontes:
  - joaopbini/feriados-brasil (MIT) — feriados estaduais e municipais de 2024, 2025 e 2026
  - kelvins/municipios-brasileiros (MIT) — coordenadas e capitais
  - dados legados do Feriados Brasil v1 (src/data/**), para slugs e redirects

Depois do lançamento o banco de dados é a fonte da verdade; este script existe só
para documentar a origem dos dados. Uso:

  python3 scripts/one-off/import_upstream.py <dir-upstream> <dir-legado> <dir-saida>
"""
import datetime as dt
import glob
import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

UP, LEGACY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
YEARS = (2024, 2025, 2026)


def slugify(value: str) -> str:
    value = unicodedata.normalize('NFD', value)
    value = ''.join(c for c in value if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def easter(year: int) -> dt.date:
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = (h + l - 7 * m + 114) % 31 + 1
    return dt.date(year, month, day)


def load(path):
    with open(path, encoding='utf-8-sig') as fh:
        return json.load(fh)


# ——— estados ————————————————————————————————————————————————

legacy_states = load(os.path.join(LEGACY, 'data/states.json'))
kelvins = load(os.path.join(UP, 'kelvins.json'))
UF_CODES = {
    11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE',
    24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
    41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
}
capitals = {UF_CODES[m['codigo_uf']]: m['codigo_ibge'] for m in kelvins if m['capital'] == 1}
states = [
    {'uf': s['uf'], 'name': s['name'], 'slug': s['slug'], 'region': s['region'], 'capitalIbge': capitals[s['uf']]}
    for s in legacy_states
]
state_by_uf = {s['uf']: s for s in states}

# ——— municípios ————————————————————————————————————————————

kel_by_ibge = {m['codigo_ibge']: m for m in kelvins}
municipalities = []
for path in sorted(glob.glob(os.path.join(LEGACY, 'data/holidays/municipalities/*/*.json'))):
    d = load(path)
    k = kel_by_ibge[d['ibgeCode']]
    municipalities.append({
        'ibge': d['ibgeCode'], 'uf': d['uf'], 'name': d['name'], 'slug': d['slug'],
        'capital': k['capital'] == 1, 'lat': k['latitude'], 'lng': k['longitude'],
    })
municipalities.sort(key=lambda m: (m['uf'], m['slug']))
muni_by_ibge = {m['ibge']: m for m in municipalities}

# ——— feriados nacionais (curadoria manual) ————————————————————————

LEI_662 = 'Lei nº 662/1949, com redação dada pela Lei nº 10.607/2002'
PLANALTO_662 = 'https://www.planalto.gov.br/ccivil_03/leis/l0662.htm'
PORTARIA = 'Portaria anual do Ministério da Gestão e da Inovação em Serviços Públicos (calendário de feriados e pontos facultativos da administração pública federal)'


def national(id, name, rule, kind, categories, summary, body, legal='', source='', valid_from=None):
    return {
        'id': id, 'name': name, 'scope': 'national', 'uf': None, 'ibge': None, 'kind': kind, 'rule': rule,
        'validFrom': valid_from, 'validTo': None, 'categories': categories, 'summary': summary, 'body': body,
        'legalBasis': legal, 'sourceUrl': source, 'status': 'verified',
    }


NATIONAL = [
    national('confraternizacao-universal', 'Confraternização Universal', 'fixed:01-01', 'feriado', ['civico'],
             'Primeiro dia do ano e feriado nacional em todo o Brasil.',
             'A Confraternização Universal abre o calendário civil e é feriado nacional obrigatório. '
             'A data celebra a paz e a união entre os povos e costuma ser marcada pelas festas de Réveillon na noite anterior, '
             'como a queima de fogos em Copacabana, no Rio de Janeiro.',
             LEI_662, PLANALTO_662),
    national('segunda-de-carnaval', 'Segunda-feira de Carnaval', 'easter:-48', 'facultativo', ['cultural'],
             'Ponto facultativo nacional, 48 dias antes da Páscoa.',
             'A segunda-feira de Carnaval não é feriado nacional por lei: é ponto facultativo definido todos os anos pelo governo federal. '
             'Estados e municípios podem decretar feriado, e empresas privadas decidem se liberam os funcionários. '
             'A data muda a cada ano porque depende da Páscoa.',
             PORTARIA),
    national('carnaval', 'Carnaval', 'easter:-47', 'facultativo', ['cultural'],
             'Terça-feira de Carnaval: ponto facultativo nacional, 47 dias antes da Páscoa.',
             'O Carnaval é a maior festa popular do Brasil, mas não é feriado nacional obrigatório: a terça-feira de Carnaval é ponto facultativo '
             'na administração federal. No estado do Rio de Janeiro é feriado estadual (Lei nº 5.243/2008), e muitos municípios também decretam feriado. '
             'A data é móvel: cai sempre 47 dias antes do Domingo de Páscoa.',
             PORTARIA),
    national('quarta-feira-de-cinzas', 'Quarta-feira de Cinzas', 'easter:-46', 'facultativo', ['religioso'],
             'Ponto facultativo até as 14h; marca o início da Quaresma.',
             'A Quarta-feira de Cinzas encerra o Carnaval e inicia a Quaresma no calendário cristão. Na administração federal é ponto facultativo '
             'até as 14 horas. A data cai 46 dias antes da Páscoa.',
             PORTARIA),
    national('sexta-feira-santa', 'Sexta-feira Santa', 'easter:-2', 'feriado', ['religioso'],
             'Sexta-feira da Paixão, feriado nacional dois dias antes da Páscoa.',
             'A Sexta-feira Santa, ou Sexta-feira da Paixão, relembra a crucificação de Jesus Cristo. É feriado em todo o país e consta como feriado nacional '
             'no calendário do governo federal. A data é móvel e cai sempre na sexta-feira anterior ao Domingo de Páscoa.',
             'Lei nº 9.093/1995 e ' + PORTARIA, 'https://www.planalto.gov.br/ccivil_03/leis/l9093.htm'),
    national('pascoa', 'Páscoa', 'easter:+0', 'comemorativa', ['religioso'],
             'Domingo de Páscoa, principal data do calendário cristão.',
             'A Páscoa celebra a ressurreição de Jesus Cristo. Cai sempre em um domingo, por isso não consta como feriado na legislação, '
             'mas define a data de outros feriados móveis: Carnaval (47 dias antes), Sexta-feira Santa (2 dias antes) e Corpus Christi (60 dias depois). '
             'O cálculo segue a regra do Concílio de Niceia: primeiro domingo após a primeira lua cheia do outono no hemisfério sul.'),
    national('tiradentes', 'Tiradentes', 'fixed:04-21', 'feriado', ['historico', 'civico'],
             'Homenagem a Joaquim José da Silva Xavier, mártir da Inconfidência Mineira.',
             'O feriado lembra a execução de Tiradentes em 21 de abril de 1792, no Rio de Janeiro. Ele foi o único condenado à morte entre os participantes '
             'da Inconfidência Mineira, movimento contra a dominação portuguesa. Na mesma data se comemora a fundação de Brasília (1960) '
             'e a Data Magna de Minas Gerais.',
             LEI_662, PLANALTO_662),
    national('dia-do-trabalho', 'Dia do Trabalho', 'fixed:05-01', 'feriado', ['social', 'civico'],
             'Dia Internacional do Trabalhador, feriado nacional.',
             'O Dia do Trabalho homenageia os trabalhadores e relembra a greve de Chicago de 1886 pela jornada de oito horas. '
             'No Brasil é feriado nacional desde 1925, e a data está ligada a conquistas como a CLT, anunciada em 1º de maio de 1943.',
             LEI_662, PLANALTO_662),
    national('corpus-christi', 'Corpus Christi', 'easter:+60', 'facultativo', ['religioso'],
             'Ponto facultativo nacional, 60 dias após a Páscoa; feriado em muitas cidades.',
             'Corpus Christi celebra a Eucaristia e cai sempre numa quinta-feira, 60 dias depois do Domingo de Páscoa. No calendário federal é ponto facultativo, '
             'mas centenas de municípios, entre eles São Paulo, Belo Horizonte e Porto Alegre, o declaram feriado municipal. '
             'É tradição enfeitar as ruas com tapetes coloridos para a procissão.',
             PORTARIA),
    national('independencia-do-brasil', 'Independência do Brasil', 'fixed:09-07', 'feriado', ['historico', 'civico'],
             'Data Magna do Brasil: proclamação da Independência em 1822.',
             'Em 7 de setembro de 1822, às margens do riacho Ipiranga, em São Paulo, Dom Pedro I proclamou a independência do Brasil em relação a Portugal. '
             'A data é celebrada com desfiles cívico-militares em todo o país, sendo o principal em Brasília.',
             LEI_662, PLANALTO_662),
    national('nossa-senhora-aparecida', 'Nossa Senhora Aparecida', 'fixed:10-12', 'feriado', ['religioso'],
             'Dia da Padroeira do Brasil; também Dia das Crianças.',
             'Nossa Senhora da Conceição Aparecida é a padroeira do Brasil. Segundo a tradição, sua imagem foi encontrada por pescadores no rio Paraíba do Sul em 1717. '
             'O Santuário Nacional, em Aparecida (SP), recebe milhões de romeiros por ano. No mesmo dia se comemora o Dia das Crianças.',
             'Lei nº 6.802/1980', 'https://www.planalto.gov.br/ccivil_03/leis/l6802.htm'),
    national('dia-do-servidor-publico', 'Dia do Servidor Público', 'fixed:10-28', 'facultativo', ['social'],
             'Ponto facultativo para servidores públicos federais.',
             'O Dia do Servidor Público está previsto no Estatuto dos Servidores (Lei nº 8.112/1990). É ponto facultativo na administração federal, '
             'e o governo pode transferir a folga para outra data. Não vale para trabalhadores da iniciativa privada.',
             'Lei nº 8.112/1990, art. 236', 'https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm'),
    national('finados', 'Finados', 'fixed:11-02', 'feriado', ['religioso'],
             'Dia de Finados, em memória dos mortos.',
             'O Dia de Finados é dedicado à memória dos que já morreram. É tradição visitar cemitérios, levar flores e acender velas. '
             'A data vem da tradição católica, que celebra os fiéis falecidos logo depois do Dia de Todos os Santos (1º de novembro).',
             LEI_662, PLANALTO_662),
    national('proclamacao-da-republica', 'Proclamação da República', 'fixed:11-15', 'feriado', ['historico', 'civico'],
             'Fim do Império e início da República, em 1889.',
             'Em 15 de novembro de 1889, o marechal Deodoro da Fonseca proclamou a República no Rio de Janeiro, encerrando o período imperial de Dom Pedro II. '
             'O Brasil passou a ser governado por um presidente, e Deodoro foi o primeiro deles.',
             LEI_662, PLANALTO_662),
    national('consciencia-negra', 'Dia Nacional de Zumbi e da Consciência Negra', 'fixed:11-20', 'feriado', ['historico', 'social'],
             'Feriado nacional desde 2024, em homenagem a Zumbi dos Palmares.',
             'O 20 de novembro relembra a morte de Zumbi dos Palmares, em 1695, líder do maior quilombo do período colonial. '
             'A data é um dia de reflexão sobre a luta contra o racismo e a valorização da cultura afro-brasileira. '
             'Era feriado apenas em alguns estados e municípios até a Lei nº 14.759/2023 torná-lo feriado nacional a partir de 2024.',
             'Lei nº 14.759/2023', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14759.htm', 2024),
    national('vespera-de-natal', 'Véspera de Natal', 'fixed:12-24', 'facultativo', ['religioso'],
             'Ponto facultativo a partir das 14h na administração federal.',
             'Na véspera de Natal, o governo federal costuma decretar ponto facultativo a partir das 14 horas. '
             'Não é feriado: o comércio e as empresas privadas funcionam normalmente, muitas vezes em horário estendido.',
             PORTARIA),
    national('natal', 'Natal', 'fixed:12-25', 'feriado', ['religioso'],
             'Nascimento de Jesus Cristo, feriado nacional.',
             'O Natal celebra o nascimento de Jesus Cristo e é uma das datas mais importantes do ano no Brasil. '
             'A ceia na noite de 24, a troca de presentes e as decorações natalinas fazem parte da tradição.',
             LEI_662, PLANALTO_662),
    national('vespera-de-ano-novo', 'Véspera de Ano Novo', 'fixed:12-31', 'facultativo', ['civico'],
             'Ponto facultativo a partir das 14h na administração federal.',
             'Assim como na véspera de Natal, o governo federal costuma decretar ponto facultativo a partir das 14 horas do dia 31 de dezembro. '
             'Não é feriado para a iniciativa privada.',
             PORTARIA),
]

# ——— datas comemorativas (não são feriado) ——————————————————————

def commemorative(id, name, rule, categories, summary):
    return {
        'id': id, 'name': name, 'scope': 'national', 'uf': None, 'ibge': None, 'kind': 'comemorativa', 'rule': rule,
        'validFrom': None, 'validTo': None, 'categories': categories, 'summary': summary, 'body': '',
        'legalBasis': '', 'sourceUrl': '', 'status': 'verified',
    }


COMMEMORATIVE = [
    commemorative('dia-internacional-da-mulher', 'Dia Internacional da Mulher', 'fixed:03-08', ['social'], 'Data de luta pelos direitos das mulheres.'),
    commemorative('dia-dos-povos-indigenas', 'Dia dos Povos Indígenas', 'fixed:04-19', ['social', 'historico'], 'Valorização das culturas indígenas (Lei nº 14.402/2022).'),
    commemorative('dia-das-maes', 'Dia das Mães', 'nth:05:0:2', ['social'], 'Comemorado no segundo domingo de maio.'),
    commemorative('dia-do-meio-ambiente', 'Dia Mundial do Meio Ambiente', 'fixed:06-05', ['social'], 'Data instituída pela ONU em 1972.'),
    commemorative('dia-dos-namorados', 'Dia dos Namorados', 'fixed:06-12', ['cultural'], 'Véspera do dia de Santo Antônio, o santo casamenteiro.'),
    commemorative('dia-de-sao-joao', 'Dia de São João', 'fixed:06-24', ['religioso', 'cultural'], 'Auge das festas juninas; feriado em vários estados e cidades do Nordeste.'),
    commemorative('dia-dos-avos', 'Dia dos Avós', 'fixed:07-26', ['social'], 'Dia de Sant\'Ana e São Joaquim, avós de Jesus.'),
    commemorative('dia-do-estudante', 'Dia do Estudante', 'fixed:08-11', ['social'], 'Criação dos primeiros cursos de Direito do Brasil, em 1827.'),
    commemorative('dia-dos-pais', 'Dia dos Pais', 'nth:08:0:2', ['social'], 'Comemorado no segundo domingo de agosto.'),
    commemorative('dia-do-folclore', 'Dia do Folclore', 'fixed:08-22', ['cultural'], 'Valorização das tradições populares brasileiras.'),
    commemorative('dia-da-arvore', 'Dia da Árvore', 'fixed:09-21', ['social'], 'Véspera do início da primavera no hemisfério sul.'),
    commemorative('dia-do-idoso', 'Dia Nacional da Pessoa Idosa', 'fixed:10-01', ['social'], 'Data do Estatuto da Pessoa Idosa.'),
    commemorative('dia-das-criancas', 'Dia das Crianças', 'fixed:10-12', ['social'], 'Coincide com o feriado de Nossa Senhora Aparecida.'),
    commemorative('dia-do-professor', 'Dia do Professor', 'fixed:10-15', ['social'], 'Ponto facultativo em muitas redes de ensino.'),
    commemorative('dia-da-bandeira', 'Dia da Bandeira', 'fixed:11-19', ['civico'], 'Adoção da bandeira republicana, em 1889.'),
]

# ——— feriados estaduais (upstream 2024–2026 + curadoria) ——————————————

def state(uf, id, name, rule, categories, summary, legal='', kind='feriado', status='unverified', source=''):
    return {
        'id': id, 'name': name, 'scope': 'state', 'uf': uf, 'ibge': None, 'kind': kind, 'rule': rule,
        'validFrom': None, 'validTo': None, 'categories': categories, 'summary': summary, 'body': '',
        'legalBasis': legal, 'sourceUrl': source, 'status': status,
    }


STATE = [
    state('AC', 'dia-do-catolico-ac', 'Dia do Católico', 'fixed:01-20', ['religioso'], 'Feriado estadual no Acre.', 'Lei estadual nº 3.137/2016'),
    state('AC', 'dia-do-evangelico-ac', 'Dia do Evangélico', 'fixed:01-23', ['religioso'], 'Feriado estadual no Acre.'),
    state('AC', 'dia-internacional-da-mulher-ac', 'Dia Internacional da Mulher', 'fixed:03-08', ['social'], 'Feriado estadual no Acre.', 'Lei estadual nº 1.411/2001'),
    state('AC', 'aniversario-do-acre', 'Aniversário do Acre', 'fixed:06-15', ['historico', 'civico'], 'Elevação do Acre à categoria de estado, em 1962.', 'Lei estadual nº 14/1964'),
    state('AC', 'revolucao-acreana', 'Início da Revolução Acreana', 'fixed:08-06', ['historico'], 'Início da Revolução Acreana, em 1902.'),
    state('AC', 'dia-da-amazonia-ac', 'Dia da Amazônia', 'fixed:09-05', ['social'], 'Feriado estadual no Acre.', 'Lei estadual nº 243/1968'),
    state('AL', 'sao-joao-al', 'São João', 'fixed:06-24', ['religioso', 'cultural'], 'Feriado estadual em Alagoas, no auge das festas juninas.'),
    state('AL', 'sao-pedro-al', 'São Pedro', 'fixed:06-29', ['religioso', 'cultural'], 'Feriado estadual em Alagoas.'),
    state('AL', 'emancipacao-politica-de-alagoas', 'Emancipação Política de Alagoas', 'fixed:09-16', ['historico', 'civico'], 'Separação de Alagoas da capitania de Pernambuco, em 1817.'),
    state('AL', 'dia-do-evangelico-al', 'Dia do Evangélico', 'fixed:11-30', ['religioso'], 'Feriado estadual em Alagoas.', 'Decreto estadual nº 56.880/2017'),
    state('AM', 'elevacao-do-amazonas', 'Elevação do Amazonas à categoria de província', 'fixed:09-05', ['historico', 'civico'], 'Data magna do Amazonas (1850).'),
    state('AM', 'nossa-senhora-da-conceicao-am', 'Nossa Senhora da Conceição', 'fixed:12-08', ['religioso'], 'Padroeira do Amazonas.'),
    state('AP', 'sao-jose-ap', 'Dia de São José', 'fixed:03-19', ['religioso'], 'São José, padroeiro do Amapá.'),
    state('AP', 'dia-de-cabralzinho', 'Dia de Cabralzinho', 'fixed:05-15', ['historico'], 'Homenagem a Francisco Xavier da Veiga Cabral, que resistiu à invasão francesa em 1895.'),
    state('AP', 'sao-tiago-ap', 'Dia de São Tiago', 'fixed:07-25', ['religioso', 'cultural'], 'Festa de São Tiago, em Mazagão Velho.', 'Lei estadual nº 1.696/2012'),
    state('AP', 'criacao-do-territorio-do-amapa', 'Criação do Território Federal do Amapá', 'fixed:09-13', ['historico', 'civico'], 'Criação do território federal, em 1943.'),
    state('AP', 'dia-do-evangelico-ap', 'Dia do Evangélico', 'fixed:11-30', ['religioso'], 'Feriado estadual no Amapá.'),
    state('BA', 'independencia-da-bahia', 'Independência da Bahia', 'fixed:07-02', ['historico', 'civico'], 'Expulsão das tropas portuguesas de Salvador, em 1823.'),
    state('CE', 'sao-jose-ce', 'Dia de São José', 'fixed:03-19', ['religioso'], 'São José, padroeiro do Ceará.', kind='facultativo'),
    state('CE', 'data-magna-do-ceara', 'Data Magna do Ceará', 'fixed:03-25', ['historico', 'civico'], 'Abolição da escravatura no Ceará, em 1884, quatro anos antes da Lei Áurea.'),
    state('DF', 'fundacao-de-brasilia', 'Fundação de Brasília', 'fixed:04-21', ['historico', 'civico'], 'Inauguração de Brasília, em 1960; coincide com Tiradentes.'),
    state('DF', 'dia-do-evangelico-df', 'Dia do Evangélico', 'fixed:11-30', ['religioso'], 'Feriado distrital no Distrito Federal.'),
    state('MA', 'adesao-do-maranhao', 'Adesão do Maranhão à Independência', 'fixed:07-28', ['historico', 'civico'], 'Adesão do Maranhão à independência do Brasil, em 1823.'),
    state('MG', 'data-magna-de-minas-gerais', 'Data Magna de Minas Gerais', 'fixed:04-21', ['historico', 'civico'], 'Homenagem a Tiradentes e à Inconfidência Mineira; coincide com o feriado nacional.'),
    state('MS', 'criacao-de-mato-grosso-do-sul', 'Criação do Estado de Mato Grosso do Sul', 'fixed:10-11', ['historico', 'civico'], 'Divisão de Mato Grosso, em 1977.'),
    state('PA', 'adesao-do-para', 'Adesão do Pará à Independência', 'fixed:08-15', ['historico', 'civico'], 'Adesão do Grão-Pará à independência do Brasil, em 1823.'),
    state('PA', 'nossa-senhora-da-conceicao-pa', 'Nossa Senhora da Conceição', 'fixed:12-08', ['religioso'], 'Feriado estadual no Pará.'),
    state('PB', 'homenagem-a-joao-pessoa', 'Homenagem a João Pessoa', 'fixed:07-26', ['historico'], 'Morte de João Pessoa, presidente da Paraíba, em 1930.'),
    state('PB', 'fundacao-da-paraiba', 'Fundação do Estado da Paraíba', 'fixed:08-05', ['historico', 'civico'], 'Fundação da Paraíba, em 1585.'),
    state('PE', 'revolucao-pernambucana', 'Revolução Pernambucana', 'fixed:03-06', ['historico', 'civico'], 'Data Magna de Pernambuco: movimento republicano de 1817.', 'Lei estadual nº 16.059/2017'),
    state('PE', 'sao-joao-pe', 'São João', 'fixed:06-24', ['religioso', 'cultural'], 'Feriado estadual em Pernambuco, no auge das festas juninas.'),
    state('PI', 'dia-do-piaui', 'Dia do Piauí', 'fixed:10-19', ['historico', 'civico'], 'Adesão do Piauí à independência, proclamada em Parnaíba em 1822.'),
    state('PR', 'emancipacao-politica-do-parana', 'Emancipação Política do Paraná', 'fixed:12-19', ['historico', 'civico'], 'Separação do Paraná da província de São Paulo, em 1853.'),
    state('RJ', 'carnaval-rj', 'Carnaval', 'easter:-47', ['cultural'], 'A terça-feira de Carnaval é feriado estadual no Rio de Janeiro.', 'Lei estadual nº 5.243/2008'),
    state('RJ', 'sao-jorge-rj', 'Dia de São Jorge', 'fixed:04-23', ['religioso', 'cultural'], 'Feriado estadual no Rio de Janeiro.', 'Lei estadual nº 5.198/2008', status='verified'),
    state('RN', 'martires-de-cunhau-e-uruacu', 'Mártires de Cunhaú e Uruaçu', 'fixed:10-03', ['religioso', 'historico'], 'Massacres de Cunhaú e Uruaçu, em 1645.', 'Lei estadual nº 8.913/2006'),
    state('RO', 'criacao-de-rondonia', 'Criação do Estado de Rondônia', 'fixed:01-04', ['historico', 'civico'], 'Instalação do estado, em 1982.'),
    state('RO', 'dia-do-evangelico-ro', 'Dia do Evangélico', 'fixed:06-18', ['religioso'], 'Feriado estadual em Rondônia.'),
    state('RR', 'criacao-de-roraima', 'Criação do Estado de Roraima', 'fixed:10-05', ['historico', 'civico'], 'Criação do estado pela Constituição de 1988.'),
    state('RS', 'revolucao-farroupilha', 'Revolução Farroupilha', 'fixed:09-20', ['historico', 'civico'], 'Dia do Gaúcho: início da Revolução Farroupilha, em 1835.'),
    state('SC', 'data-magna-de-santa-catarina', 'Data Magna de Santa Catarina', 'fixed:08-11', ['historico', 'civico'], 'Criação da capitania de Santa Catarina, em 1738.'),
    state('SE', 'emancipacao-de-sergipe', 'Emancipação Política de Sergipe', 'fixed:07-08', ['historico', 'civico'], 'Separação de Sergipe da Bahia, em 1820.'),
    state('SP', 'revolucao-constitucionalista', 'Revolução Constitucionalista', 'fixed:07-09', ['historico', 'civico'], 'Data Magna de São Paulo: início da Revolução de 1932.', 'Lei estadual nº 9.497/1997', status='verified'),
    state('TO', 'nossa-senhora-da-natividade', 'Nossa Senhora da Natividade', 'fixed:09-08', ['religioso'], 'Padroeira do Tocantins.'),
    state('TO', 'criacao-do-tocantins', 'Criação do Estado do Tocantins', 'fixed:10-05', ['historico', 'civico'], 'Criação do estado pela Constituição de 1988.'),
]

# ——— feriados municipais ————————————————————————————————————————

NATIONAL_FERIADO_RULES = {h['rule'] for h in NATIONAL if h['kind'] == 'feriado'} | {'fixed:11-20'}
STATE_RULES = defaultdict(set)
for h in STATE:
    STATE_RULES[h['uf']].add(h['rule'])

GENERIC = re.compile(r'^(feriado( municipal)?|facultativo|feriado local)$', re.I)
ANNIVERSARY = re.compile(r'^(anivers[aá]rio|funda[cç][aã]o)( d[aoe] (cidade|munic[ií]pio))?$', re.I)
EMANCIPATION = re.compile(r'^emancipa[cç][aã]o( pol[ií]tica)?( d[aoe] (cidade|munic[ií]pio))?$', re.I)
PATRON = re.compile(r'^(dia d[oa] )?padroeir[oa]( d[oa] (cidade|munic[ií]pio))?$', re.I)

# Dias santos de data fixa muito comuns como feriado de padroeiro.
SAINTS = {
    '01-06': 'Dia de Santos Reis', '01-20': 'Dia de São Sebastião', '03-19': 'Dia de São José',
    '04-23': 'Dia de São Jorge', '06-13': 'Dia de Santo Antônio', '06-24': 'Dia de São João',
    '06-29': 'Dia de São Pedro', '07-16': 'Nossa Senhora do Carmo', '07-26': 'Dia de Sant\'Ana',
    '08-15': 'Assunção de Nossa Senhora', '08-16': 'Dia de São Roque', '09-08': 'Natividade de Nossa Senhora',
    '09-15': 'Nossa Senhora das Dores', '09-29': 'Dia de São Miguel Arcanjo', '10-04': 'Dia de São Francisco de Assis',
    '10-07': 'Nossa Senhora do Rosário', '11-01': 'Dia de Todos os Santos', '11-21': 'Nossa Senhora da Apresentação',
    '11-25': 'Dia de Santa Catarina', '11-27': 'Nossa Senhora das Graças', '12-04': 'Dia de Santa Bárbara',
    '12-08': 'Nossa Senhora da Conceição', '12-13': 'Dia de Santa Luzia',
}

MOVABLE_BY_NAME = [
    (re.compile(r'corpus', re.I), 60, 'Corpus Christi'),
    (re.compile(r'sexta.*(santa|paix)', re.I), -2, None),
    (re.compile(r'quinta.*santa', re.I), -3, 'Quinta-feira Santa'),
    (re.compile(r'cinzas', re.I), -46, 'Quarta-feira de Cinzas'),
    (re.compile(r'segunda.*carnaval', re.I), -48, 'Segunda-feira de Carnaval'),
    (re.compile(r'carnaval', re.I), -47, 'Carnaval'),
    (re.compile(r'p[aá]scoa', re.I), 0, None),
]

# Deslocamentos litúrgicos conhecidos (dias após a Páscoa) aceitos na detecção automática.
MOVABLE_OFFSETS = {-48: None, -47: 'Carnaval', -46: 'Quarta-feira de Cinzas', -3: 'Quinta-feira Santa', -2: None,
                   8: None, 39: 'Ascensão do Senhor', 49: 'Pentecostes', 50: 'Segunda-feira de Pentecostes',
                   56: 'Santíssima Trindade', 60: 'Corpus Christi', 68: 'Sagrado Coração de Jesus',
                   69: 'Imaculado Coração de Maria'}

LAW = re.compile(r'((Lei|Decreto|Lei Org[aâ]nica|Lei Complementar|Resolu[cç][aã]o)\b[^;]{3,160}?\d{4})', re.I)


def clean_text(value):
    return re.sub(r'\s+', ' ', (value or '')).strip(' .,-')


upstream = defaultdict(list)  # ibge -> [(year, date, name, desc)]
for year in YEARS:
    for row in load(os.path.join(UP, f'feriados{year}.json')):
        if row['tipo'] != 'MUNICIPAL' or not row.get('codigo_ibge'):
            continue
        d, m, y = row['data'].split('/')
        upstream[row['codigo_ibge']].append((year, dt.date(int(y), int(m), int(d)), clean_text(row['nome']), clean_text(row.get('descricao'))))

municipal = []
used_ids = set(h['id'] for h in NATIONAL + COMMEMORATIVE + STATE)
stats = Counter()


def unique_id(base):
    candidate, n = base, 2
    while candidate in used_ids:
        candidate = f'{base}-{n}'
        n += 1
    used_ids.add(candidate)
    return candidate


for ibge, rows in sorted(upstream.items()):
    city = muni_by_ibge.get(ibge)
    if not city:
        stats['cidade-desconhecida'] += 1
        continue
    groups = defaultdict(list)  # rule -> [(year, name, desc)]
    for year, date, name, desc in rows:
        offset = (date - easter(year)).days
        movable = None
        for pattern, off, _ in MOVABLE_BY_NAME:
            if pattern.search(name):
                movable = off
                break
        if movable is not None and movable == offset:
            rule = f'easter:{offset:+d}'
        else:
            rule = f'fixed:{date:%m-%d}'
        groups[rule].append((year, name, desc))

    # Datas móveis sem nome: detecta pelo deslocamento constante em relação à Páscoa em ≥2 anos.
    fixed_by_offset = defaultdict(list)
    for year, date, name, desc in rows:
        fixed_by_offset[(date - easter(year)).days].append((year, date))
    for offset, hits in fixed_by_offset.items():
        years = {y for y, _ in hits}
        dates = {d.strftime('%m-%d') for _, d in hits}
        if len(years) >= 2 and len(dates) >= 2 and offset in MOVABLE_OFFSETS:
            rule = f'easter:{offset:+d}'
            for _, d in hits:
                moved = groups.pop(f'fixed:{d:%m-%d}', [])
                groups[rule].extend(moved)

    for rule, entries in groups.items():
        years = {e[0] for e in entries}
        if rule.startswith('fixed:') and len(years) == 1 and len(rows) > 3 and 2026 in years and len({r[0] for r in rows}) == 3:
            # data que só aparece em um dos três anos: provável transferência pontual, ignora
            stats['descartado-ano-unico'] += 1
            continue
        if rule in NATIONAL_FERIADO_RULES or rule == 'easter:-2' or rule == 'easter:+0':
            stats['duplicado-nacional'] += 1
            continue
        if rule in STATE_RULES[city['uf']]:
            stats['duplicado-estadual'] += 1
            continue
        names = [e[1] for e in entries if e[1] and not GENERIC.match(e[1])]
        descs = [e[2] for e in entries if e[2]]
        name = Counter(names).most_common(1)[0][0] if names else None
        status = 'unverified'
        summary = ''
        mmdd = rule[6:] if rule.startswith('fixed:') else None
        if rule.startswith('easter:'):
            off = int(rule[7:])
            canonical = next((label for _, o, label in MOVABLE_BY_NAME if o == off and label), None)
            name = canonical or name or MOVABLE_OFFSETS.get(off)
        if name and ANNIVERSARY.match(name):
            name = f'Aniversário de {city["name"]}'
        elif name and EMANCIPATION.match(name):
            name = f'Emancipação política de {city["name"]}'
        elif name and PATRON.match(name):
            saint = SAINTS.get(mmdd or '')
            name = f'{saint} (padroeiro de {city["name"]})' if saint else f'Dia do Padroeiro de {city["name"]}'
        if not name:
            saint = SAINTS.get(mmdd or '')
            if saint:
                name = saint
                summary = 'Nome sugerido pela data (dia santo no calendário católico). Ajude a confirmar.'
                stats['nome-inferido'] += 1
            else:
                name = f'Feriado municipal de {city["name"]}'
                status = 'incomplete'
                stats['sem-nome'] += 1
        legal = ''
        for desc in descs:
            m = LAW.search(desc)
            if m:
                legal = clean_text(m.group(1))
                break
        if not summary:
            for desc in descs:
                if desc and not LAW.search(desc) and not GENERIC.match(desc) and desc.lower() != name.lower() and len(desc) > 12:
                    summary = desc[:280]
                    break
        name = re.sub(r'\bN\. ?Sra\.?', 'Nossa Senhora', name)
        name = name[0].upper() + name[1:]
        kind = 'feriado'
        categories = ['historico', 'civico'] if name.startswith(('Aniversário', 'Emancipação')) else ['religioso'] if re.search(r'(S[aã]o|Santa|Santo|Nossa Senhora|Corpus|Reis|Assun|Natividade|Padroeir)', name) else []
        municipal.append({
            'id': unique_id(f'{slugify(name.split(" (")[0])}-{city["slug"]}-{city["uf"].lower()}'),
            'name': name, 'scope': 'municipal', 'uf': city['uf'], 'ibge': ibge, 'kind': kind, 'rule': rule,
            'validFrom': None, 'validTo': None, 'categories': categories, 'summary': summary, 'body': '',
            'legalBasis': legal, 'sourceUrl': '', 'status': status,
        })
        stats[status] += 1

municipal.sort(key=lambda h: (h['uf'], h['ibge'], h['rule']))

# ——— redirects das URLs antigas ————————————————————————————————————

LEGACY_IDS = {
    'confraternizacao-universal': 'confraternizacao-universal', 'carnaval-segunda': 'segunda-de-carnaval',
    'carnaval-terca': 'carnaval', 'quarta-cinzas': 'quarta-feira-de-cinzas', 'sexta-santa': 'sexta-feira-santa',
    'pascoa': 'pascoa', 'tiradentes': 'tiradentes', 'dia-do-trabalho': 'dia-do-trabalho', 'corpus-christi': 'corpus-christi',
    'independencia': 'independencia-do-brasil', 'nossa-senhora-aparecida': 'nossa-senhora-aparecida', 'finados': 'finados',
    'proclamacao-republica': 'proclamacao-da-republica', 'consciencia-negra': 'consciencia-negra', 'natal': 'natal',
    'dia-da-mulher': 'dia-internacional-da-mulher', 'dia-do-indio': 'dia-dos-povos-indigenas', 'dia-das-maes': 'dia-das-maes',
    'dia-do-meio-ambiente': 'dia-do-meio-ambiente', 'dia-dos-namorados': 'dia-dos-namorados', 'dia-de-sao-joao': 'dia-de-sao-joao',
    'dia-dos-avos': 'dia-dos-avos', 'dia-do-estudante': 'dia-do-estudante', 'dia-dos-pais': 'dia-dos-pais',
    'dia-do-folclore': 'dia-do-folclore', 'dia-da-arvore': 'dia-da-arvore', 'dia-do-idoso': 'dia-do-idoso',
    'dia-das-criancas': 'dia-das-criancas', 'dia-do-professor': 'dia-do-professor', 'dia-do-servidor-publico': 'dia-do-servidor-publico',
    'dia-da-bandeira': 'dia-da-bandeira',
    'aniversario-acre': 'aniversario-do-acre', 'emancipacao-alagoas': 'emancipacao-politica-de-alagoas', 'sao-joao-alagoas': 'sao-joao-al',
    'eleicao-amazonas': 'elevacao-do-amazonas', 'dia-do-amazonense': 'elevacao-do-amazonas', 'criacao-amapa': 'criacao-do-territorio-do-amapa',
    'sao-jose-amapa': 'sao-jose-ap', 'independencia-bahia': 'independencia-da-bahia', 'abolicao-ceara': 'data-magna-do-ceara',
    'aniversario-brasilia': 'fundacao-de-brasilia', 'dia-do-evangelho-df': 'dia-do-evangelico-df', 'adesao-maranhao': 'adesao-do-maranhao',
    'inconfidencia-mineira': 'data-magna-de-minas-gerais', 'criacao-ms': 'criacao-de-mato-grosso-do-sul', 'adesao-para': 'adesao-do-para',
    'criacao-para': 'adesao-do-para', 'fundacao-paraiba': 'fundacao-da-paraiba', 'revolucao-pernambucana': 'revolucao-pernambucana',
    'sao-joao-pe': 'sao-joao-pe', 'dia-do-piaui': 'dia-do-piaui', 'emancipacao-parana': 'emancipacao-politica-do-parana',
    'sao-jorge-rj': 'sao-jorge-rj', 'criacao-rondonia': 'criacao-de-rondonia', 'dia-do-evangelho-ro': 'dia-do-evangelico-ro',
    'criacao-roraima': 'criacao-de-roraima', 'revolucao-farroupilha': 'revolucao-farroupilha', 'dia-do-gaucho': 'revolucao-farroupilha',
    'criacao-sc': 'data-magna-de-santa-catarina', 'independencia-sergipe': 'emancipacao-de-sergipe',
    'revolucao-constitucionalista': 'revolucao-constitucionalista', 'criacao-tocantins': 'criacao-do-tocantins',
    'nossa-senhora-natividade': 'nossa-senhora-da-natividade',
}
redirects = {f'/feriado/{old}/': f'/feriado/{new}/' for old, new in LEGACY_IDS.items() if old != new}

# Demais IDs estaduais antigos (inventados ou removidos) → página do estado.
for path in glob.glob(os.path.join(LEGACY, 'data/holidays/states/*.json')):
    d = load(path)
    for h in d['holidays']:
        if h['id'] not in LEGACY_IDS:
            redirects[f'/feriado/{h["id"]}/'] = f'/{d["uf"].lower()}/'

# IDs municipais antigos → página da cidade.
for path in glob.glob(os.path.join(LEGACY, 'data/holidays/municipalities/*/*.json')):
    d = load(path)
    for h in d['holidays']:
        redirects.setdefault(f'/feriado/{h["id"]}/', f'/{d["uf"].lower()}/{d["slug"]}/')

# ——— saída ————————————————————————————————————————————————————————

os.makedirs(OUT, exist_ok=True)


def write_lines(name, rows):
    """Um objeto por linha: diffs legíveis no Git mesmo com milhares de registros."""
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
        fh.write('[\n')
        fh.write(',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in rows))
        fh.write('\n]\n')


def write_pretty(name, rows):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=2)
        fh.write('\n')


write_pretty('states.json', states)
write_lines('municipalities.json', municipalities)
write_pretty('holidays-national.json', NATIONAL + COMMEMORATIVE)
write_pretty('holidays-state.json', STATE)
write_lines('holidays-municipal.json', municipal)
write_lines('redirects.json', [{'fromPath': k, 'toPath': v} for k, v in sorted(redirects.items())])

print('estados', len(states), 'municípios', len(municipalities))
print('nacionais', len(NATIONAL), 'comemorativas', len(COMMEMORATIVE), 'estaduais', len(STATE), 'municipais', len(municipal))
print('redirects', len(redirects))
print(dict(stats))
