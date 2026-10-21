/* Painel de demonstração do atendimento com IA (21/10/2026).
   Adaptado do CRM da Bruno Repolês (clientes/BrunoRepoles/site/crm/), mas pra uma clínica
   de estética FICTÍCIA, a Clínica Bella Vita: tudo aqui é inventado, nomes, valores e
   conversas. As chaves internas (imoveis, IMOVEIS virou SERV) ficaram parecidas com as de
   lá de propósito, pra o código dos dois continuar comparável. */

const EQUIPE = {
  clara:  { nome: 'Clara',    papel: 'Esteticista responsável', cor: '#8f5c0c', sigla: 'CL' },
  paula:  { nome: 'Paula',    papel: 'Esteticista',             cor: '#2f5d9e', sigla: 'PA' },
  bianca: { nome: 'Bianca',   papel: 'Esteticista',             cor: '#9b4f8f', sigla: 'BI' },
  recep:  { nome: 'Recepção', papel: 'Recepção',                cor: '#3d7a6a', sigla: 'RE' },
};
let rodizio = ['bianca', 'paula'];
const foraRodizio = new Set();

const SERV = {
  limpeza:      { nome: 'Limpeza de pele',        cat: 'Facial',    preco: 180, dur: '1h30',   ic: 'sparkles',   extra: 'Pacote de 6 com desconto', procuras: 46, agendados: 31 },
  drenagem:     { nome: 'Drenagem linfática',     cat: 'Corporal',  preco: 120, dur: '1h',     ic: 'droplets',   extra: 'Também pelo Wellhub',      procuras: 39, agendados: 27 },
  redutora:     { nome: 'Massagem redutora',      cat: 'Corporal',  preco: 130, dur: '1h',     ic: 'hand-heart', extra: 'Também pelo Wellhub',      procuras: 31, agendados: 22 },
  laser:        { nome: 'Depilação a laser',      cat: 'Depilação', preco: 150, dur: '30 min', ic: 'zap',        extra: 'Valor por região',         procuras: 28, agendados: 19 },
  harmonizacao: { nome: 'Harmonização corporal',  cat: 'Corporal',  preco: 0,   dur: 'Começa pela avaliação', ic: 'heart-pulse', extra: 'Pacote definido na avaliação', procuras: 24, agendados: 16 },
  peeling:      { nome: 'Peeling químico',        cat: 'Facial',    preco: 220, dur: '1h',     ic: 'flower-2',   extra: 'Avaliação antes',          procuras: 17, agendados: 11 },
  micro:        { nome: 'Microagulhamento',       cat: 'Facial',    preco: 350, dur: '1h30',   ic: 'target',     extra: 'Sessões definidas na avaliação', procuras: 14, agendados: 9 },
};
/* Fotos ilustrativas (21/10/2026), Unsplash, licença livre, as mesmas já licenciadas pra
   Ana Flávia (Fotos e Imagens/unsplash/ dela). Em img/serv-<chave>.webp, 640x480:
   limpeza photo-1761718210089-ba3bb5ccb54f · drenagem photo-1712638932314-e2b185ca0930 ·
   redutora photo-1745327883508-b6cd32e5dde5 · laser photo-1700760933574-9f0f4ea9aa3b ·
   harmonizacao photo-1731355774353-4131a8e13e55 · peeling photo-1625243436522-19071f005a39 ·
   micro photo-1731355773301-ebbf3457e877 */
for (const [k, s] of Object.entries(SERV)) s.foto = 'img/serv-' + k + '.webp';
const precoTxt = s => s.preco ? 'R$ ' + s.preco.toLocaleString('pt-BR') : 'Na avaliação';

const ETAPAS = [
  { id: 'novo',      nome: 'Novo contato',       cor: '#b9b6ae' },
  { id: 'conversa',  nome: 'Em conversa',        cor: '#ebb455' },
  { id: 'avaliacao', nome: 'Avaliação agendada', cor: '#d9962b' },
  { id: 'agendado',  nome: 'Sessão agendada',    cor: '#2f5d9e' },
  { id: 'pacote',    nome: 'Pacote proposto',    cor: '#5b3fa0' },
  { id: 'fechado',   nome: 'Pacote fechado',     cor: '#1b8a56' },
];

/* ---------- Clientes e conversas (fictícios) ---------- */
const LEADS = [
  { id: 'mariana', nome: 'Mariana Couto', tel: '(31) 9 ••••-4821', origem: 'Instagram', neg: 'Primeira vez', interesse: 'Limpeza de pele antes de um casamento', valor: 180, serv: 'limpeza',
    etapa: 'agendado', status: 'eq', resp: 'paula', quando: '08:20', ordem: 96, naoLidas: 0,
    resumo: 'Quer limpeza de pele antes de um casamento no dia 15. Pele oleosa, nunca fez. Agendou quinta às 18h30 com a Paula.',
    proximo: 'Sessão quinta, 18h30, com a Paula',
    msgs: [
      { dia: 'Ontem' },
      { de: 'cli', h: '22:47', txt: 'Boa noite! Vocês fazem limpeza de pele? Tenho um casamento dia 15' },
      { de: 'ia', h: '22:47', txt: 'Boa noite, Mariana! Fazemos sim. A limpeza leva cerca de 1h30, e o ideal é fazer de 5 a 7 dias antes do evento, pra pele estar no ponto.' },
      { de: 'ia', h: '22:47', serv: 'limpeza' },
      { de: 'ia', h: '22:48', txt: 'Sua pele é mais oleosa, seca ou mista? E já fez limpeza antes?' },
      { de: 'cli', h: '22:49', audio: '0:08', txt: 'Oleosa. Nunca fiz, vai ser a primeira vez.' },
      { de: 'ia', h: '22:49', txt: 'Perfeito, a profissional ajusta tudo pra pele oleosa. Tenho quinta às 17h ou às 18h30. Qual fica melhor?' },
      { de: 'cli', h: '22:50', txt: '18h30' },
      { de: 'ia', h: '22:50', txt: 'Combinado! Quinta às 18h30 com a Paula. Na quarta eu te mando um lembrete.' },
      { de: 'sis', ic: 'user-check', txt: 'Sessão agendada: quinta, 18h30. Cliente passada para Paula com o resumo.' },
      { dia: 'Hoje' },
      { de: 'eq', quem: 'paula', h: '08:14', txt: 'Bom dia, Mariana! Aqui é a Paula. Te espero quinta às 18h30. Vem sem maquiagem, tá?' },
      { de: 'cli', h: '08:20', txt: 'Combinado, obrigada!' },
    ] },
  { id: 'larissa', nome: 'Larissa Prado', tel: '(31) 9 ••••-1077', origem: 'Google', neg: 'Wellhub', interesse: 'Drenagem linfática pelo Wellhub', valor: 0, serv: 'drenagem',
    etapa: 'agendado', status: 'eq', resp: 'recep', quando: '07:12', ordem: 95, naoLidas: 1,
    resumo: 'Quer drenagem pelo Wellhub, plano Gold+. Pediu horário hoje, depois das 18h.',
    proximo: 'Confirmar horário hoje, depois das 18h',
    msgs: [
      { dia: 'Hoje' },
      { de: 'cli', h: '07:10', audio: '0:12', txt: 'Bom dia! Vocês aceitam Wellhub pra drenagem? Meu plano é o Gold+.' },
      { de: 'ia', h: '07:10', audio: '0:09', txt: 'Bom dia, Larissa! Aceitamos sim, a drenagem entra no Gold+. Quando chegar, é só fazer o check-in no app.' },
      { de: 'ia', h: '07:10', serv: 'drenagem' },
      { de: 'cli', h: '07:11', txt: 'Ótimo! Tem horário hoje?' },
      { de: 'ia', h: '07:11', txt: 'Hoje tenho depois das 18h. Vou confirmar o horário certinho com a recepção e já te retorno.' },
      { de: 'sis', ic: 'user-check', txt: 'Pedido de horário para hoje, depois das 18h. Conversa passada para a Recepção.' },
    ] },
  { id: 'renata', nome: 'Renata Gomes', tel: '(31) 9 ••••-3390', origem: 'Indicação', neg: 'Cliente da casa', interesse: 'Pacote de 10 drenagens com desconto', valor: 1000, serv: 'drenagem',
    etapa: 'pacote', status: 'eq', resp: 'clara', quando: 'Ontem', ordem: 90, naoLidas: 0,
    resumo: 'Fez 3 drenagens avulsas e quer fechar 10. Pediu desconto: conversa passada pra Clara, que cuida dos pacotes.',
    proximo: 'Clara manda a proposta do pacote',
    msgs: [
      { dia: 'Ontem' },
      { de: 'cli', h: '16:05', txt: 'Oi! Quero fechar um pacote de drenagem, vocês fazem desconto?' },
      { de: 'ia', h: '16:05', txt: 'Oi, Renata! Temos o pacote de 10 sessões. Desconto e condição de pagamento quem combina é a Clara, nossa responsável. Já passei pra ela!' },
      { de: 'sis', ic: 'tag', txt: 'Pedido de desconto: conversa passada para Clara com o resumo.' },
      { de: 'eq', quem: 'clara', h: '16:40', txt: 'Renata, boa tarde! Aqui é a Clara. Pra você, que já é cliente, consigo as 10 sessões por R$ 1.000 em até 3x. Fechamos?' },
    ] },
  { id: 'patricia', nome: 'Patrícia Alves', tel: '(31) 9 ••••-5512', origem: 'Instagram', neg: 'Primeira vez', interesse: 'Depilação a laser nas axilas', valor: 150, serv: 'laser',
    etapa: 'agendado', status: 'eq', resp: 'bianca', quando: 'Ontem', ordem: 88, naoLidas: 0,
    resumo: 'Perguntou de depilação a laser e parou de responder. Voltou depois do follow-up de 3 dias e agendou sexta, 15h.',
    proximo: 'Sessão sexta, 15h, com a Bianca',
    msgs: [
      { dia: 'Quinta-feira' },
      { de: 'cli', h: '15:02', txt: 'Oi, quanto fica a depilação a laser na axila?' },
      { de: 'ia', h: '15:02', txt: 'Oi, Patrícia! A axila sai por R$ 150 a sessão. Quantas sessões, a profissional define no primeiro atendimento.' },
      { de: 'ia', h: '15:02', serv: 'laser' },
      { de: 'ia', h: '15:03', txt: 'Quer agendar a primeira sessão?' },
      { dia: 'Ontem' },
      { de: 'ia', h: '10:00', fu: true, txt: 'Oi, Patrícia! Ficou alguma dúvida sobre a depilação a laser? Se quiser, tenho horário essa semana.' },
      { de: 'cli', h: '10:41', txt: 'Oi! Quero sim, só estava sem tempo. Sexta à tarde dá?' },
      { de: 'ia', h: '10:41', txt: 'Dá sim! Sexta às 15h fica bom? Já deixo reservado com a Bianca.' },
      { de: 'cli', h: '10:43', txt: 'Fica sim' },
      { de: 'sis', ic: 'user-check', txt: 'Cliente recuperada pelo follow-up. Sessão sexta, 15h. Passada para Bianca.' },
    ] },
  { id: 'gabriela', nome: 'Gabriela Pereira', tel: '(31) 9 ••••-2268', origem: 'Site', neg: 'Primeira vez', interesse: 'Peeling para manchas no rosto', valor: 220, serv: 'peeling',
    etapa: 'conversa', status: 'ag', resp: null, quando: 'Ontem', ordem: 85, naoLidas: 0,
    resumo: 'Perguntou de peeling para manchas. Recebeu as informações e a oferta de avaliação, ainda não respondeu.',
    proximo: 'Follow-up automático hoje, 10h',
    msgs: [
      { dia: 'Ontem' },
      { de: 'cli', h: '19:32', txt: 'Qual o valor do peeling? Tenho umas manchas no rosto' },
      { de: 'ia', h: '19:32', txt: 'Oi, Gabriela! O peeling químico sai por R$ 220. Pra manchas, a profissional avalia sua pele antes, pra escolher o tratamento certo.' },
      { de: 'ia', h: '19:32', serv: 'peeling' },
      { de: 'ia', h: '19:33', txt: 'Quer agendar uma avaliação? É rapidinha e sem custo.' },
      { de: 'sis', ic: 'repeat', txt: 'Sem resposta. Follow-up agendado para amanhã, 10h.' },
    ] },
  { id: 'aline', nome: 'Aline Martins', tel: '(31) 9 ••••-6604', origem: 'Instagram', neg: 'Primeira vez', interesse: 'Tratamento para gordura localizada', valor: 0, serv: 'harmonizacao',
    etapa: 'novo', status: 'ia', resp: null, quando: 'Ontem', ordem: 84, naoLidas: 0,
    resumo: 'Quer tratar gordura localizada. A assistente perguntou a região e se ela já fez algum tratamento.',
    proximo: 'Esperando a resposta da cliente',
    msgs: [
      { dia: 'Ontem' },
      { de: 'cli', h: '23:12', txt: 'Boa noite, vocês têm tratamento pra gordura localizada?' },
      { de: 'ia', h: '23:12', txt: 'Boa noite, Aline! Temos a harmonização corporal, que combina técnicas pra cada região. Qual região você quer tratar? E já fez algum tratamento antes?' },
    ] },
  { id: 'carla', nome: 'Carla Mendes', tel: '(31) 9 ••••-0819', origem: 'Google', neg: 'Primeira vez', interesse: 'Micropigmentação de sobrancelha', valor: 0, serv: null,
    etapa: 'novo', status: 'ia', resp: null, quando: 'Ontem', ordem: 83, naoLidas: 0,
    resumo: 'Procura micropigmentação, que a clínica não faz. A assistente explicou e ofereceu avisar se passar a fazer.',
    proximo: 'Avisar se a clínica passar a fazer',
    msgs: [
      { dia: 'Ontem' },
      { de: 'cli', h: '23:58', txt: 'Vcs fazem micropigmentação de sobrancelha?' },
      { de: 'ia', h: '23:58', txt: 'Oi, Carla! Esse serviço a gente não faz no momento. Posso te avisar se passarmos a fazer? E se quiser cuidar da pele, temos limpeza e peeling.' },
    ] },
  { id: 'fernanda', nome: 'Fernanda Lopes', tel: '(31) 9 ••••-7745', origem: 'Instagram', neg: 'Pacote', interesse: 'Pacote de harmonização corporal', valor: 1800, serv: 'harmonizacao',
    etapa: 'pacote', status: 'eq', resp: 'clara', quando: 'Sábado', ordem: 80, naoLidas: 0,
    resumo: 'Fez a avaliação e recebeu a proposta do pacote. Perguntou sobre parcelar em mais vezes: passada pra Clara.',
    proximo: 'Clara responde sobre o parcelamento',
    msgs: [
      { dia: 'Sábado' },
      { de: 'cli', h: '11:20', txt: 'Dá pra parcelar o pacote em 6 vezes?' },
      { de: 'ia', h: '11:20', txt: 'Boa pergunta, Fernanda. Condição de pagamento quem combina é a Clara. Já passei pra ela, ela te chama em seguida.' },
      { de: 'sis', ic: 'user-check', txt: 'Pedido de condição de pagamento. Conversa passada para Clara.' },
      { de: 'eq', quem: 'clara', h: '11:34', txt: 'Oi, Fernanda! Aqui é a Clara. Consigo em 5x sem juros no cartão. Te mando o link de pagamento?' },
    ] },
  { id: 'beatriz', nome: 'Beatriz Souza', tel: '(31) 9 ••••-3154', origem: 'Wellhub', neg: 'Wellhub', interesse: 'Massagem redutora', valor: 0, serv: 'redutora',
    etapa: 'agendado', status: 'eq', resp: 'bianca', quando: 'Sexta', ordem: 78, naoLidas: 0,
    resumo: 'Vem pelo Wellhub. Agendou massagem redutora pra quarta, 17h.',
    proximo: 'Sessão quarta, 17h, com a Bianca',
    msgs: [
      { dia: 'Sexta-feira' },
      { de: 'cli', h: '18:47', txt: 'Oi, a massagem redutora entra no Wellhub?' },
      { de: 'ia', h: '18:47', txt: 'Oi, Beatriz! Entra sim, a partir do plano Gold+. Quer agendar?' },
      { de: 'ia', h: '18:47', serv: 'redutora' },
      { de: 'cli', h: '18:52', txt: 'Quero, quarta à tarde' },
      { de: 'ia', h: '18:52', txt: 'Combinado! Quarta às 17h com a Bianca. Quando chegar, é só fazer o check-in no app.' },
      { de: 'sis', ic: 'user-check', txt: 'Sessão agendada: quarta, 17h. Passada para Bianca.' },
    ] },
  { id: 'luciana', nome: 'Luciana Dias', tel: '(31) 9 ••••-9930', origem: 'Google', neg: 'Primeira vez', interesse: 'Flacidez no abdômen depois da gestação', valor: 0, serv: 'harmonizacao',
    etapa: 'avaliacao', status: 'eq', resp: 'clara', quando: 'Sexta', ordem: 76, naoLidas: 0,
    resumo: 'Quer tratar flacidez no abdômen depois da gestação. Avaliação marcada pra sábado, 9h, com a Clara.',
    proximo: 'Avaliação sábado, 9h, com a Clara',
    msgs: [
      { dia: 'Sexta-feira' },
      { de: 'cli', h: '21:05', txt: 'Vocês tratam flacidez na barriga? Tive bebê há um ano' },
      { de: 'ia', h: '21:05', txt: 'Oi, Luciana! Tratamos sim. Como cada pele responde de um jeito, começa por uma avaliação, sem custo.' },
      { de: 'ia', h: '21:05', serv: 'harmonizacao' },
      { de: 'cli', h: '21:09', txt: 'Sábado de manhã dá?' },
      { de: 'ia', h: '21:09', txt: 'Dá sim! Sábado às 9h com a Clara, que é a nossa responsável.' },
      { de: 'sis', ic: 'user-check', txt: 'Avaliação agendada: sábado, 9h. Passada para Clara.' },
    ] },
  { id: 'camila', nome: 'Camila Rocha', tel: '(31) 9 ••••-4417', origem: 'Site', neg: 'Primeira vez', interesse: 'Microagulhamento para marcas de acne', valor: 350, serv: 'micro',
    etapa: 'conversa', status: 'ia', resp: null, quando: 'Sexta', ordem: 74, naoLidas: 0,
    resumo: 'Quer microagulhamento para marcas de acne. Perguntou se dói. Ficou de ver a agenda.',
    proximo: 'Follow-up automático hoje, 14h30',
    msgs: [
      { dia: 'Sexta-feira' },
      { de: 'cli', h: '12:15', txt: 'Microagulhamento dói?' },
      { de: 'ia', h: '12:15', txt: 'Oi, Camila! Antes, a profissional aplica um creme anestésico, então o desconforto é pequeno. A pele fica avermelhada por um ou dois dias.' },
      { de: 'cli', h: '12:20', txt: 'É pra marca de acne' },
      { de: 'ia', h: '12:20', txt: 'Entendi! Pra marca de acne, a profissional define o número de sessões na avaliação. Quer marcar?' },
      { de: 'cli', h: '12:22', txt: 'Vou ver minha agenda e te falo' },
    ] },
  { id: 'tatiane', nome: 'Tatiane Nunes', tel: '(31) 9 ••••-2083', origem: 'Indicação', neg: 'Cliente da casa', interesse: 'Renovar o pacote de drenagem', valor: 1000, serv: 'drenagem',
    etapa: 'pacote', status: 'eq', resp: 'paula', quando: 'Quinta', ordem: 70, naoLidas: 0,
    resumo: 'Terminou o pacote de drenagem e quer renovar.',
    proximo: 'Paula manda a renovação',
    msgs: [
      { dia: 'Quinta-feira' },
      { de: 'cli', h: '09:10', txt: 'Terminei meu pacote, quero renovar!' },
      { de: 'eq', quem: 'paula', h: '09:16', txt: 'Que bom, Tatiane! Vou te mandar a renovação com as mesmas condições.' },
    ] },
  { id: 'roberta', nome: 'Roberta Alves', tel: '(31) 9 ••••-6128', origem: 'Instagram', neg: 'Pacote', interesse: 'Pacote de 6 limpezas de pele', valor: 900, serv: 'limpeza',
    etapa: 'fechado', status: 'fim', resp: 'paula', quando: 'Qua', ordem: 60, naoLidas: 0,
    resumo: 'Fechou o pacote de 6 limpezas de pele.',
    proximo: 'Pedir avaliação no Google',
    msgs: [
      { dia: 'Quarta-feira' },
      { de: 'cli', h: '17:40', txt: 'Paguei o pacote! Obrigada pela atenção' },
      { de: 'eq', quem: 'paula', h: '17:45', txt: 'Obrigada, Roberta! Te espero na próxima sessão.' },
    ] },
  { id: 'joana', nome: 'Joana Ribeiro', tel: '(31) 9 ••••-8851', origem: 'Indicação', neg: 'Primeira vez', interesse: 'Depilação a laser na perna', valor: 0, serv: 'laser',
    etapa: null, status: 'fim', resp: null, quando: 'Qua', ordem: 58, naoLidas: 0,
    resumo: 'Perguntou de depilação a laser. Respondeu ao follow-up dizendo que fechou em outro lugar. Conversa encerrada sem insistir.',
    proximo: 'Nenhum: cliente disse não',
    msgs: [
      { dia: 'Segunda-feira' },
      { de: 'cli', h: '19:20', txt: 'Boa noite, quanto fica o laser na perna inteira?' },
      { de: 'ia', h: '19:20', txt: 'Boa noite, Joana! A perna inteira sai por R$ 390 a sessão. Quer agendar?' },
      { dia: 'Quarta-feira' },
      { de: 'ia', h: '09:30', fu: true, txt: 'Oi, Joana! Ainda pensa em fazer o laser? Tenho horário essa semana, se quiser.' },
      { de: 'cli', h: '10:02', txt: 'Obrigada, mas já fechei em outro lugar' },
      { de: 'ia', h: '10:02', txt: 'Entendi, Joana. Obrigada pelo retorno! Se precisar, é só chamar.' },
      { de: 'sis', ic: 'ban', txt: 'Cliente disse não. Conversa encerrada e nenhum follow-up será enviado.' },
    ] },
];

/* Contatos novos que o botão "Simular" faz chegar */
const SIMULACOES = [
  { id: 'vanessa', nome: 'Vanessa Lima', tel: '(31) 9 ••••-2735', origem: 'Instagram', neg: 'Primeira vez', interesse: 'Limpeza de pele antes do aniversário', valor: 180, serv: 'limpeza',
    resumo: 'Quer limpeza de pele antes do aniversário. Pele mista, primeira vez. Sessão agendada: quinta, 17h30.',
    proximo: 'Sessão quinta, 17h30',
    roteiro: [
      { de: 'cli', txt: 'Oi, boa noite! Quanto fica a limpeza de pele?' },
      { de: 'ia', txt: 'Boa noite, Vanessa! A limpeza de pele sai por R$ 180 e leva cerca de 1h30.' },
      { de: 'ia', serv: 'limpeza' },
      { de: 'ia', txt: 'Sua pele é mais oleosa, seca ou mista? Já fez limpeza antes?' },
      { de: 'cli', audio: '0:07', txt: 'Mista. Nunca fiz, quero fazer antes do meu aniversário.' },
      { de: 'ia', audio: '0:08', txt: 'Que bom! Então o ideal é fazer uns cinco dias antes. Tenho quinta às 17h30 ou sexta às 10h.' },
      { de: 'cli', txt: 'Quinta 17h30' },
      { de: 'ia', txt: 'Combinado! Quinta às 17h30. Um dia antes eu te mando um lembrete.' },
      { de: 'sis', ic: 'user-check', txt: 'Sessão agendada: quinta, 17h30. Cliente passada para {corretor} com o resumo.' },
    ] },
  { id: 'priscila', nome: 'Priscila Gomes', tel: '(31) 9 ••••-5049', origem: 'Google', neg: 'Wellhub', interesse: 'Drenagem pelo Wellhub depois do trabalho', valor: 0, serv: 'drenagem',
    resumo: 'Vem pelo Wellhub, plano Platinum. Quer drenagem depois do trabalho. Sessão agendada: amanhã, 18h.',
    proximo: 'Sessão amanhã, 18h',
    roteiro: [
      { de: 'cli', txt: 'Oi! Vocês aceitam Wellhub?' },
      { de: 'ia', txt: 'Oi, Priscila! Aceitamos sim. Drenagem e massagem redutora entram a partir do Gold+.' },
      { de: 'ia', serv: 'drenagem' },
      { de: 'ia', txt: 'Qual é o seu plano? E qual horário fica melhor pra você?' },
      { de: 'cli', txt: 'Platinum. Depois das 18h' },
      { de: 'ia', txt: 'Perfeito! Tenho amanhã às 18h. Posso reservar?' },
      { de: 'cli', txt: 'Pode' },
      { de: 'ia', txt: 'Reservado, amanhã às 18h. Quando chegar, é só fazer o check-in no app.' },
      { de: 'sis', ic: 'user-check', txt: 'Sessão agendada: amanhã, 18h. Cliente passada para {corretor} com o resumo.' },
    ] },
];
let simIndice = 0;
let simRodando = false;

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const ic = (n, c = '') => `<svg class="ic ${c}"><use href="#i-${n}"/></svg>`;
const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const valorCurto = l => l.valor ? brl(l.valor) : '';
const iniciais = n => n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
const corLead = n => ['#6b6a72', '#7d6b55', '#5f6f7a', '#77657d', '#5e7464', '#80695e'][n.length % 6];
const espera = ms => new Promise(r => setTimeout(r, ms));
const agoraHora = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function semente(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const dica = $('#dica');
function mostraDica(html, e) {
  dica.innerHTML = html; dica.classList.add('on');
  const x = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 10);
  const y = Math.max(e.clientY - dica.offsetHeight - 12, 10);
  dica.style.left = x + 'px'; dica.style.top = y + 'px';
}
const escondeDica = () => dica.classList.remove('on');

function avisa(titulo, texto, icone = 'bell') {
  const el = document.createElement('div');
  el.className = 'aviso';
  el.innerHTML = `${ic(icone)}<div><b>${titulo}</b><small>${texto}</small></div>`;
  $('#avisos').appendChild(el);
  setTimeout(() => { el.classList.add('sai'); setTimeout(() => el.remove(), 300); }, 4600);
}

/* ---------- Navegação ---------- */
const TITULOS = { painel: 'Painel', conversas: 'Conversas', funil: 'Funil de atendimento', followups: 'Follow-ups', imoveis: 'Serviços', equipe: 'Equipe e rodízio', assistente: 'Regras da assistente' };
const renderizado = {};
function vai() {
  let v = location.hash.replace('#', '') || 'painel';
  if (!TITULOS[v]) v = 'painel';
  document.querySelectorAll('.vista').forEach(s => s.classList.toggle('ativa', s.id === 'v-' + v));
  document.querySelectorAll('[data-v]').forEach(a => a.classList.toggle('ativo', a.dataset.v === v));
  $('#titulo').textContent = TITULOS[v];
  if (!renderizado[v]) { RENDER[v](); renderizado[v] = true; }
  if (v === 'conversas' && !selecionada && innerWidth > 980) abreConversa(LEADS[0].id);
  window.scrollTo(0, 0);
}
addEventListener('hashchange', vai);

/* ---------- Painel ---------- */
const DIAS = (() => {
  const r = semente(7), out = [], hoje = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje); d.setDate(hoje.getDate() - i);
    const sem = d.getDay();
    const base = sem === 0 ? 7 : sem === 6 ? 12 : 16;
    const total = Math.round(base + (r() - .5) * 8);
    const pFora = sem === 0 ? .82 : sem === 6 ? .5 : .3 + r() * .1;
    const fora = Math.round(total * pFora);
    out.push({ d, com: total - fora, fora });
  }
  return out;
})();
const TOTAL = DIAS.reduce((s, x) => s + x.com + x.fora, 0);
const FORA = DIAS.reduce((s, x) => s + x.fora, 0);

function renderKpis() {
  const k = [
    ['message-circle', 'Contatos em 30 dias', TOTAL, '+12% sobre o mês anterior'],
    ['bot', 'Respondidos pela assistente', '100%', 'nenhum contato sem resposta'],
    ['timer', 'Primeira resposta', '9 s', 'em média, 24 horas por dia'],
    ['moon', 'Chegaram fora do horário', FORA, Math.round(FORA / TOTAL * 100) + '% dos contatos', true],
    ['calendar-check', 'Sessões agendadas', 96, '+14 nesta semana'],
    ['user-check', 'Passadas à equipe', 48, 'já com o resumo'],
  ];
  $('#kpis').innerHTML = k.map(([i, r, n, v, neutro]) => `<div class="card kpi"><div class="rot">${ic(i)}${r}</div><div class="num">${n}</div><div class="var ${neutro ? 'neutro' : ''}">${neutro ? '' : ic('trending-up', 'ic-sm')}${v}</div></div>`).join('');
}

function renderDias() {
  const W = 680, H = 230, mL = 30, mB = 24, mT = 8, pw = W - mL - 4, ph = H - mB - mT;
  const max = Math.ceil(Math.max(...DIAS.map(x => x.com + x.fora)) / 5) * 5;
  const bw = pw / DIAS.length, gap = 3, w = bw - gap;
  const y = v => mT + ph - (v / max) * ph;
  let s = '';
  for (let g = 0; g <= max; g += max / 4) s += `<line x1="${mL}" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="#ece9e2" stroke-width="1"/><text x="${mL - 6}" y="${y(g) + 4}" text-anchor="end">${g}</text>`;
  DIAS.forEach((x, i) => {
    const x0 = mL + i * bw + gap / 2;
    const yCom = y(x.com), yTop = y(x.com + x.fora);
    s += `<rect x="${x0}" y="${yCom}" width="${w}" height="${mT + ph - yCom}" fill="#2f5d9e"/>`;
    const h2 = Math.max(yCom - yTop - 2, 0), r = Math.min(4, w / 2, h2);
    s += `<path d="M${x0},${yCom - 2} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + w - r} Q${x0 + w},${yTop} ${x0 + w},${yTop + r} V${yCom - 2} Z" fill="#d9962b"/>`;
    if (i % 5 === 4 || i === 29) s += `<text x="${x0 + w / 2}" y="${H - 6}" text-anchor="middle">${i === 29 ? 'Hoje' : x.d.getDate() + '/' + (x.d.getMonth() + 1)}</text>`;
    s += `<rect class="hit" data-i="${i}" x="${mL + i * bw}" y="${mT}" width="${bw}" height="${ph}" fill="transparent"/>`;
  });
  $('#g-dias').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Contatos por dia nos últimos 30 dias">${s}</svg>`;
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  $('#g-dias').querySelectorAll('.hit').forEach(h => {
    h.addEventListener('mousemove', e => { const x = DIAS[h.dataset.i]; mostraDica(`<b>${nomes[x.d.getDay()]}, ${x.d.getDate()}/${x.d.getMonth() + 1}</b><br>Horário da clínica: ${x.com}<br>Fora do horário: ${x.fora}<br>Total: ${x.com + x.fora}`, e); });
    h.addEventListener('mouseleave', escondeDica);
  });
  $('#r-dias').innerHTML = `<span>Horário da clínica: <b>${TOTAL - FORA}</b></span><span>Fora do horário: <b>${FORA}</b> (${Math.round(FORA / TOTAL * 100)}%)</span><span>Média: <b>${Math.round(TOTAL / 30)}</b> por dia</span>`;
}

function hbar(alvo, linhas, base) {
  const max = Math.max(...linhas.map(l => l[1]));
  alvo.innerHTML = linhas.map(([n, v, extra]) => `<div class="hbar-linha" data-n="${n}" data-v="${v}"><span class="nome">${n}</span><span class="trilho"><span class="barra" style="width:0" data-w="${v / max * 100}"></span></span><span class="val">${v}${extra ? `<small>${extra}</small>` : ''}</span></div>`).join('');
  void alvo.offsetWidth;
  setTimeout(() => alvo.querySelectorAll('.barra').forEach(b => b.style.width = b.dataset.w + '%'), 60);
  alvo.querySelectorAll('.hbar-linha').forEach(l => {
    l.addEventListener('mousemove', e => mostraDica(`<b>${l.dataset.n}</b><br>${l.dataset.v}${base ? ` de ${base} (${Math.round(l.dataset.v / base * 100)}%)` : ''}`, e));
    l.addEventListener('mouseleave', escondeDica);
  });
}

function renderFunil() {
  const q = Math.round(TOTAL * .55);
  const linhas = [['Contatos', TOTAL], ['Em conversa', q], ['Agendaram', 96], ['Pacote proposto', 22], ['Pacote fechado', 13]];
  hbar($('#g-funil'), linhas.map(([n, v]) => [n, v, Math.round(v / TOTAL * 100) + '%']), TOTAL);
}

function renderOrigem() {
  const p = [['Instagram', .38], ['Google (ficha e site)', .29], ['Wellhub', .14], ['Indicação', .12], ['Site', .07]];
  hbar($('#g-origem'), p.map(([n, f]) => [n, Math.round(TOTAL * f)]), TOTAL);
}

function renderCalor() {
  const horas = ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const r = semente(21);
  const util = [1, 4, 5, 7, 5, 6, 8, 8, 5], fds = [1, 3, 6, 5, 3, 3, 5, 8, 6];
  const m = dias.map((_, d) => horas.map((_, h) => Math.round((d < 5 ? util[h] : fds[h]) * (d === 6 ? .8 : 1) * (.8 + r() * .45))));
  const max = Math.max(...m.flat());
  const rampa = ['#f8ecd4', '#f0d29c', '#e3b25e', '#c98a28', '#8f5c0c'];
  let pico = { v: 0 };
  let s = '<span></span>' + horas.map(h => `<span class="rc">${h}</span>`).join('');
  m.forEach((linha, d) => {
    s += `<span class="rl">${dias[d]}</span>`;
    linha.forEach((v, h) => {
      if (v > pico.v) pico = { v, d, h };
      const c = rampa[Math.min(4, Math.floor(v / max * 4.999))];
      s += `<span class="cel" style="background:${c}" data-t="<b>${dias[d]}, ${horas[h]} às ${parseInt(horas[h]) + 2}h</b><br>${v} contatos no mês"></span>`;
    });
  });
  $('#g-calor').innerHTML = s;
  $('#g-calor').querySelectorAll('.cel').forEach(c => { c.addEventListener('mousemove', e => mostraDica(c.dataset.t, e)); c.addEventListener('mouseleave', escondeDica); });
  const nomes = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  $('#r-calor').innerHTML = `Pico: <b style="color:var(--text)">${nomes[pico.d]}, ${horas[pico.h]} às ${parseInt(horas[pico.h]) + 2}h</b>`;
}

const FEED = [
  ['bot', '#fbf3e2', '#8f5c0c', 'Assistente respondeu <b>Larissa Prado</b> por áudio em 6 s', 'hoje, 07:10'],
  ['user-check', '#eaf0f9', '#2f5d9e', '<b>Mariana Couto</b> agendou limpeza de pele com a Paula', 'ontem, 22:50'],
  ['repeat', '#fbf3e2', '#8f5c0c', 'Follow-up trouxe <b>Patrícia Alves</b> de volta', 'ontem, 10:41'],
  ['tag', '#e5f5ec', '#1b8a56', 'Pedido de pacote: <b>Renata Gomes</b> passada pra Clara', 'ontem, 16:05'],
  ['ban', '#f1f0ec', '#6c6a72', '<b>Joana Ribeiro</b> disse não. Nenhum follow-up será enviado', 'quarta, 10:02'],
];
function itemFeed([i, bg, cor, t, q], novo) { return `<div class="feed-item ${novo ? 'novo' : ''}"><span class="bola" style="background:${bg};color:${cor}">${ic(i)}</span><div>${t}<small>${q}</small></div></div>`; }
function renderFeed() { $('#feed').innerHTML = FEED.slice(0, 5).map(f => itemFeed(f)).join(''); }
function addFeed(f) { FEED.unshift(f); if (renderizado.painel) $('#feed').innerHTML = FEED.slice(0, 5).map((x, i) => itemFeed(x, i === 0)).join(''); }

const AGENDA = [
  ['Larissa Prado', 'Hoje, 18h30', 'drenagem', 'recep'],
  ['Beatriz Souza', 'Quarta, 17h', 'redutora', 'bianca'],
  ['Mariana Couto', 'Quinta, 18h30', 'limpeza', 'paula'],
  ['Patrícia Alves', 'Sexta, 15h', 'laser', 'bianca'],
  ['Luciana Dias', 'Sábado, 9h', 'harmonizacao', 'clara'],
];
function renderVisitas() {
  $('#visitas').innerHTML = AGENDA.map(([n, q, sv, r]) => { const s = SERV[sv], p = EQUIPE[r]; return `<div class="feed-item"><img src="${s.foto}" alt="" style="width:44px;height:34px;object-fit:cover;border-radius:7px"><div><b>${n}</b> · ${s.nome}<small>${q} com ${p.nome}</small></div></div>`; }).join('');
}

function renderTopImoveis() {
  const lista = Object.values(SERV).sort((a, b) => b.procuras - a.procuras).slice(0, 5);
  $('#top-imoveis').innerHTML = lista.map(s => `<div class="top-imovel"><img src="${s.foto}" alt=""><div><b>${s.nome}</b><small>${s.cat} · ${precoTxt(s)}</small></div><div class="n">${s.procuras}<small>pedidos</small></div></div>`).join('');
}

/* ---------- Conversas ---------- */
let selecionada = null, filtro = 'todas';
function chipStatus(l) {
  if (l.status === 'ia') return `<span class="chip chip-ia">${ic('bot')}Com a assistente</span>`;
  if (l.status === 'eq') return `<span class="chip chip-eq">${ic('user-check')}Com ${EQUIPE[l.resp].nome}</span>`;
  if (l.status === 'ag') return `<span class="chip chip-ag">${ic('clock-3')}Aguardando cliente</span>`;
  return `<span class="chip chip-fim">${ic('check')}Encerrada</span>`;
}
function previa(l) {
  const m = [...l.msgs].reverse().find(x => x.de && x.de !== 'sis');
  if (!m) return '';
  const quem = m.de === 'ia' ? 'Assistente: ' : m.de === 'eq' ? EQUIPE[m.quem].nome + ': ' : '';
  return quem + (m.audio ? 'Áudio (' + m.audio + ')' : m.serv ? 'Serviço: ' + SERV[m.serv].nome : m.txt);
}
function renderLista() {
  const ls = LEADS.filter(l => filtro === 'todas' || l.status === filtro).sort((a, b) => b.ordem - a.ordem);
  $('#convs').innerHTML = ls.map(l => `<button class="conv ${l.id === selecionada ? 'sel' : ''} ${l.nova ? 'nova' : ''}" data-id="${l.id}"><span class="avatar" style="background:${corLead(l.nome)}">${iniciais(l.nome)}</span><span class="meio"><span class="l1"><b>${l.nome}</b><time>${l.quando}</time></span><span class="prev" style="display:block">${previa(l)}</span>${chipStatus(l)}</span></button>`).join('') || '<p style="padding:20px;color:var(--muted);font-size:13px">Nenhuma conversa aqui.</p>';
  $('#convs').querySelectorAll('.conv').forEach(b => b.onclick = () => abreConversa(b.dataset.id));
  $('#cont-conv').textContent = LEADS.filter(l => l.status === 'ia').length;
}

function htmlMsg(m) {
  if (m.dia) return `<div class="dia">${m.dia}</div>`;
  if (m.de === 'sis') return `<div class="msg sis">${ic(m.ic || 'info')}<span>${m.txt}</span></div>`;
  const out = m.de !== 'cli';
  const autor = m.de === 'ia' ? `<div class="autor ia">${ic('bot')}Assistente</div>` : m.de === 'eq' ? `<div class="autor eq">${ic('user')}${EQUIPE[m.quem].nome}</div>` : '';
  const hora = `<div class="hora">${m.h || ''}${out ? ic('check-check') : ''}</div>`;
  let corpo;
  if (m.serv) {
    const s = SERV[m.serv];
    corpo = `<div class="imovel-msg"><img src="${s.foto}" alt=""><div><b>${s.nome}</b><small>${s.cat} · ${s.dur}</small><small><b style="color:#111;display:inline">${precoTxt(s)}</b></small><span>${ic('calendar-check', 'ic-sm')}Agende por aqui mesmo</span></div></div>`;
  } else if (m.audio) {
    const r = semente(m.txt.length), ondas = Array.from({ length: 28 }, () => `<i style="height:${4 + Math.round(r() * 18)}px;animation-delay:${(r() * .8).toFixed(2)}s"></i>`).join('');
    corpo = `<div class="audio" data-dur="${m.audio}"><button class="play" aria-label="Tocar áudio">${ic('play')}</button><span class="ondas">${ondas}</span><span class="dur">${m.audio}</span>${m.de === 'ia' ? '<span class="foto">BV</span>' : ''}</div><div class="transc"><b>${m.de === 'cli' ? 'Transcrição' : 'Texto falado'}:</b> ${m.txt}</div>`;
  } else {
    corpo = (m.fu ? `<div class="tag-fu">${ic('repeat', 'ic-sm')}Follow-up automático</div><br>` : '') + m.txt;
  }
  return `<div class="msg ${out ? 'out' : 'cli'}">${autor}${corpo}${hora}</div>`;
}

function ligaAudios(raiz) {
  raiz.querySelectorAll('.audio .play').forEach(b => b.onclick = () => {
    const a = b.closest('.audio'); if (a.classList.contains('tocando')) return;
    a.classList.add('tocando'); b.innerHTML = ic('pause');
    const seg = a.dataset.dur.split(':').reduce((m, s) => m * 60 + +s, 0);
    setTimeout(() => { a.classList.remove('tocando'); b.innerHTML = ic('play'); }, Math.min(seg, 6) * 1000);
  });
}

function abreConversa(id) {
  selecionada = id;
  const l = LEADS.find(x => x.id === id); if (!l) return;
  l.naoLidas = 0; l.nova = false;
  renderLista();
  const podeDigitar = l.status === 'eq' && l.resp === 'recep';
  $('#chat').innerHTML = `
    <div class="chat-topo">
      <button class="icone-btn btn-voltar-chat" aria-label="Voltar">${ic('chevron-left')}</button>
      <span class="avatar" style="background:${corLead(l.nome)}">${iniciais(l.nome)}</span>
      <div><b>${l.nome}</b><small>${l.tel} · ${l.origem}</small></div>
      <div class="acoes">${l.status === 'ia' || l.status === 'ag' ? `<button class="btn" id="assumir">${ic('hand', 'ic-sm')}<span>Assumir conversa</span></button>` : l.status === 'eq' ? `<button class="btn" id="devolver">${ic('bot', 'ic-sm')}<span>Devolver pra assistente</span></button>` : ''}<button class="icone-btn" id="ver-ficha" aria-label="Ficha da cliente">${ic('info')}</button></div>
    </div>
    <div class="mensagens" id="mensagens">${l.msgs.map(htmlMsg).join('')}</div>
    ${l.status === 'ia' || l.status === 'ag' ? `<div class="aviso-ia">${ic('bot', 'ic-sm')}<span>A assistente está cuidando desta conversa.</span><button id="assumir2">Assumir</button></div>` : ''}
    <div class="chat-base"><input class="campo" id="campo" placeholder="${podeDigitar ? 'Escreva uma mensagem' : l.status === 'eq' ? 'Conversa com ' + EQUIPE[l.resp].nome : 'Assuma a conversa para escrever'}" ${podeDigitar ? '' : 'disabled'}><button class="icone-btn" id="enviar" aria-label="Enviar">${ic('send')}</button></div>`;
  const box = $('#mensagens'); box.scrollTop = box.scrollHeight;
  ligaAudios(box);
  const assumir = () => {
    l.status = 'eq'; l.resp = 'recep'; l.ordem = Math.max(...LEADS.map(x => x.ordem)) + 1; l.quando = agoraHora();
    l.msgs.push({ de: 'sis', ic: 'hand', txt: 'A recepção assumiu a conversa. A assistente parou de responder aqui.' });
    abreConversa(id); $('#campo').focus();
  };
  if ($('#assumir')) $('#assumir').onclick = assumir;
  if ($('#assumir2')) $('#assumir2').onclick = assumir;
  if ($('#devolver')) $('#devolver').onclick = () => { l.status = 'ia'; l.resp = null; l.msgs.push({ de: 'sis', ic: 'bot', txt: 'Conversa devolvida para a assistente.' }); abreConversa(id); };
  const enviar = () => { const c = $('#campo'); if (!c.value.trim() || c.disabled) return; l.msgs.push({ de: 'eq', quem: 'recep', h: agoraHora(), txt: c.value.trim().replace(/</g, '&lt;') }); l.quando = agoraHora(); abreConversa(id); };
  $('#enviar').onclick = enviar;
  $('#campo').onkeydown = e => { if (e.key === 'Enter') enviar(); };
  $('#ver-ficha').onclick = () => $('#ficha').classList.toggle('aberta');
  $('.btn-voltar-chat').onclick = () => { $('#v-conversas').classList.remove('mostra-chat'); selecionada = null; renderLista(); };
  $('#v-conversas').classList.add('mostra-chat');
  renderFicha(l);
}

function renderFicha(l) {
  const et = ETAPAS.find(e => e.id === l.etapa);
  $('#ficha').innerHTML = `
    <div class="ficha-cab"><span class="avatar" style="background:${corLead(l.nome)}">${iniciais(l.nome)}</span><b>${l.nome}</b><small>${l.tel}</small><div style="margin-top:8px">${chipStatus(l)}</div></div>
    <h4>Resumo da assistente</h4>
    <div class="resumo-ia"><div class="t">${ic('sparkles')}Escrito pela assistente</div>${l.resumo}</div>
    <h4>O que procura</h4>
    <div class="dado"><span>Perfil</span><b>${l.neg}</b></div>
    <div class="dado"><span>Interesse</span><b>${l.interesse}</b></div>
    ${l.serv ? `<div class="dado"><span>Serviço</span><b>${SERV[l.serv].nome}</b></div>` : ''}
    ${l.valor ? `<div class="dado"><span>Valor</span><b>${valorCurto(l)}</b></div>` : ''}
    <h4>Andamento</h4>
    <div class="dado"><span>Origem</span><b>${l.origem}</b></div>
    <div class="dado"><span>Etapa</span><b>${et ? et.nome : 'Encerrado'}</b></div>
    <div class="dado"><span>Responsável</span><b>${l.resp ? EQUIPE[l.resp].nome : 'Assistente'}</b></div>
    <div class="dado"><span>Próximo passo</span><b>${l.proximo}</b></div>
    ${innerWidth <= 1280 ? '<button class="btn" style="margin-top:16px;width:100%;justify-content:center" onclick="document.getElementById(\'ficha\').classList.remove(\'aberta\')">Fechar</button>' : ''}`;
}

function renderConversas() {
  renderLista();
  $('#filtros').querySelectorAll('button').forEach(b => b.onclick = () => { filtro = b.dataset.f; $('#filtros').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); renderLista(); });
}

/* ---------- Funil ---------- */
function renderKanban() {
  const ativos = LEADS.filter(l => l.etapa);
  const pot = ativos.filter(l => l.etapa !== 'fechado').reduce((s, l) => s + l.valor, 0);
  $('#funil-total').innerHTML = `<b>${ativos.length}</b> clientes no funil · Potencial em atendimentos e pacotes: <b>${brl(pot)}</b>`;
  $('#kanban').innerHTML = ETAPAS.map(e => {
    const cs = ativos.filter(l => l.etapa === e.id).sort((a, b) => b.ordem - a.ordem);
    return `<div class="coluna" data-e="${e.id}"><div class="col-cab"><i style="background:${e.cor}"></i><div>${e.nome}</div><span class="n">${cs.length}</span></div>${cs.map(l => `
      <div class="lead-card ${l.chegou ? 'chegou' : ''}" draggable="true" data-id="${l.id}"><b>${l.nome}</b><div class="int">${l.interesse}</div>
      <div class="pe">${l.valor ? `<span class="valor">${valorCurto(l)}</span>` : `<span class="chip chip-ok">${ic(l.neg === 'Wellhub' ? 'badge-check' : 'calendar-check')}${l.neg === 'Wellhub' ? 'Wellhub' : 'Avaliação'}</span>`}<span class="chip chip-ag" style="font-size:10.5px">${l.origem}</span>
      ${l.resp ? `<span class="avatar" style="background:${EQUIPE[l.resp].cor}" title="${EQUIPE[l.resp].nome}">${EQUIPE[l.resp].sigla}</span>` : `<span class="avatar" style="background:#d9962b" title="Assistente">${ic('bot', 'ic-sm')}</span>`}</div></div>`).join('')}</div>`;
  }).join('');
  ativos.forEach(l => l.chegou = false);
  let arrastado = null;
  $('#kanban').querySelectorAll('.lead-card').forEach(c => {
    c.ondragstart = () => { arrastado = c.dataset.id; c.classList.add('arrastando'); };
    c.ondragend = () => c.classList.remove('arrastando');
    c.onclick = () => { location.hash = 'conversas'; setTimeout(() => abreConversa(c.dataset.id), 0); };
  });
  $('#kanban').querySelectorAll('.coluna').forEach(col => {
    col.ondragover = e => { e.preventDefault(); col.classList.add('alvo'); };
    col.ondragleave = () => col.classList.remove('alvo');
    col.ondrop = e => {
      e.preventDefault(); col.classList.remove('alvo');
      const l = LEADS.find(x => x.id === arrastado); if (!l || l.etapa === col.dataset.e) return;
      l.etapa = col.dataset.e; l.chegou = true;
      const et = ETAPAS.find(x => x.id === l.etapa);
      renderKanban();
      avisa(`${l.nome} foi para ${et.nome}`, 'O painel e os relatórios já foram atualizados.', 'kanban');
      if (l.etapa === 'fechado') addFeed(['star', '#e5f5ec', '#1b8a56', `Pacote fechado com <b>${l.nome}</b>`, 'agora']);
    };
  });
}

/* ---------- Follow-ups ---------- */
const FOLLOWUPS = [
  { quando: 'Hoje', h: '10:00', lead: 'Gabriela Pereira', motivo: 'Não respondeu sobre a avaliação do peeling', toque: '1º toque', msg: 'Oi, Gabriela! Ficou alguma dúvida sobre o peeling? Se quiser, tenho avaliação amanhã no fim da tarde.', st: 'ag' },
  { quando: 'Hoje', h: '14:30', lead: 'Camila Rocha', motivo: 'Ia ver a agenda pro microagulhamento', toque: '1º toque', msg: 'Oi, Camila! Conseguiu ver sua agenda? Tenho horário sexta de manhã pro microagulhamento, se te ajudar.', st: 'ag' },
  { quando: 'Amanhã', h: '09:00', lead: 'Aline Martins', motivo: 'Não respondeu sobre a região do tratamento', toque: '1º toque', msg: 'Oi, Aline! Pra te indicar o tratamento certo, me conta: qual região você quer tratar?', st: 'ag' },
  { quando: 'Amanhã', h: '11:00', lead: 'Beatriz Souza', motivo: 'Lembrete da sessão de quarta, 17h', toque: 'Lembrete', msg: 'Oi, Beatriz! Passando pra confirmar sua massagem redutora amanhã às 17h com a Bianca. Tudo certo?', st: 'ag' },
  { quando: 'Quarta', h: '10:00', lead: 'Mariana Couto', motivo: 'Lembrete da limpeza de quinta, 18h30', toque: 'Lembrete', msg: 'Oi, Mariana! Amanhã às 18h30 é a sua limpeza de pele com a Paula. Lembra de vir sem maquiagem!', st: 'ag' },
  { quando: 'Ontem', h: '10:00', lead: 'Patrícia Alves', motivo: 'Respondeu e agendou', toque: '2º toque', msg: 'Oi, Patrícia! Ficou alguma dúvida sobre a depilação a laser? Se quiser, tenho horário essa semana.', st: 'ok' },
  { quando: 'Quarta', h: '09:30', lead: 'Joana Ribeiro', motivo: 'Disse que fechou em outro lugar', toque: 'Encerrado', msg: 'Nenhum toque novo. Cliente disse não.', st: 'bad' },
];
function renderFollowups() {
  const k = [['repeat', 'Agendados', FOLLOWUPS.filter(f => f.st === 'ag').length, 'próximos 7 dias'], ['send', 'Enviados no mês', 58, 'só em horário comercial'], ['message-circle', 'Responderam', 24, '41% dos enviados'], ['calendar-check', 'Sessões que vieram de follow-up', 11, 'clientes que tinham sumido']];
  $('#fu-kpis').innerHTML = k.map(([i, r, n, v]) => `<div class="card kpi"><div class="rot">${ic(i)}${r}</div><div class="num">${n}</div><div class="var neutro">${v}</div></div>`).join('');
  const chip = { ag: `<span class="chip chip-ia">${ic('clock-3')}Agendado</span>`, ok: `<span class="chip chip-ok">${ic('check')}Respondeu</span>`, bad: `<span class="chip chip-bad">${ic('ban')}Cancelado</span>` };
  $('#fu-lista').innerHTML = FOLLOWUPS.map(f => `<div class="fu-item"><div class="quando"><b>${f.quando}</b><small>${f.h}</small></div><div class="q"><b>${f.lead}</b> · ${f.toque}<small>${f.motivo}</small><div class="prev">${f.msg}</div></div><div>${chip[f.st]}</div></div>`).join('');
}

/* ---------- Serviços ---------- */
function renderImoveis() {
  $('#imo-grade').innerHTML = Object.values(SERV).map(s => `
    <div class="card imo"><div class="foto"><img src="${s.foto}" alt="${s.nome}" loading="lazy"><span class="chip chip-ok">${ic('check')}Ativo</span><span class="ref">${s.cat}</span></div>
    <div class="info"><b>${s.nome}</b><div class="preco">${precoTxt(s)}</div>
    <div class="specs"><span>${ic('clock-3', 'ic-sm')}${s.dur}</span></div>
    <div class="specs" style="margin-top:6px"><span>${ic('tag', 'ic-sm')}${s.extra}</span></div>
    <div class="uso"><div><b>${s.procuras}</b><small>pedidos no mês</small></div><div><b>${s.agendados}</b><small>agendados pela assistente</small></div></div>
    <button class="btn editar-serv" style="margin-top:10px;width:100%;justify-content:center">${ic('sliders-horizontal', 'ic-sm')}Editar serviço</button></div></div>`).join('');
  document.querySelectorAll('.editar-serv').forEach(b => b.onclick = () => avisa('Editar serviço', 'Na versão de vocês, aqui muda valor, duração e o que a assistente fala sobre ele.', 'sliders-horizontal'));
}

/* ---------- Equipe ---------- */
function renderRodizio() {
  const ordem = rodizio.filter(r => !foraRodizio.has(r)).concat(rodizio.filter(r => foraRodizio.has(r)));
  const vez = ordem.find(r => !foraRodizio.has(r));
  $('#rodizio').innerHTML = ordem.map((r, i) => { const p = EQUIPE[r]; return `<div class="rod ${r === vez ? 'vez' : ''}"><span class="pos">${i + 1}</span><span class="avatar" style="background:${p.cor}">${p.sigla}</span><div><b>${p.nome}</b><small>${foraRodizio.has(r) ? 'Fora do rodízio' : r === vez ? 'Próxima cliente é dela' : 'Na fila'}</small></div><div class="dir">${r === vez ? '<span class="chip chip-ia">Da vez</span>' : ''}<button class="chave ${foraRodizio.has(r) ? '' : 'on'}" data-r="${r}" aria-label="Disponível"></button></div></div>`; }).join('')
    + `<div class="rod"><span class="pos">${ic('tag', 'ic-sm')}</span><span class="avatar" style="background:${EQUIPE.clara.cor}">CL</span><div><b>Clara</b><small>Recebe pacotes, descontos e avaliações</small></div></div>
       <div class="rod"><span class="pos">${ic('message-circle', 'ic-sm')}</span><span class="avatar" style="background:${EQUIPE.recep.cor}">RE</span><div><b>Recepção</b><small>Wellhub, remarcações e o que a assistente não sabe</small></div></div>`;
  $('#rodizio').querySelectorAll('.chave').forEach(c => c.onclick = () => {
    const r = c.dataset.r;
    if (foraRodizio.has(r)) foraRodizio.delete(r); else { if (rodizio.filter(x => !foraRodizio.has(x)).length === 1) return avisa('Precisa de alguém no rodízio', 'Pelo menos uma profissional tem que ficar disponível.', 'info'); foraRodizio.add(r); }
    renderRodizio();
  });
}
function renderEquipe() {
  renderRodizio();
  const linhas = [['paula', 44, 31, 5, 4, '5 min'], ['bianca', 41, 28, 4, 3, '7 min'], ['clara', 12, 9, 6, 5, '10 min'], ['recep', 19, 8, 0, 0, '3 min']];
  const max = 44;
  $('#tab-eq').innerHTML = `<tr><th>Pessoa</th><th>Clientes recebidas</th><th>Agendaram</th><th>Pacotes propostos</th><th>Pacotes fechados</th><th>Tempo pra assumir</th></tr>` + linhas.map(([r, le, vi, pr, fe, t]) => { const p = EQUIPE[r]; return `<tr><td class="nome"><span class="avatar" style="background:${p.cor}">${p.sigla}</span><div>${p.nome}<small>${p.papel}</small></div></td><td><div style="display:flex;align-items:center;gap:8px"><b>${le}</b><span class="mini-trilho"><i style="width:${le / max * 100}%"></i></span></div></td><td>${vi}</td><td>${pr || '-'}</td><td>${fe || '-'}</td><td>${t}</td></tr>`; }).join('');
}

/* ---------- Regras da assistente ---------- */
const ligaCheck = c => c.onclick = () => { c.classList.toggle('on'); c.setAttribute('aria-checked', c.classList.contains('on')); };
function checks(alvo, itens, dica, rotulo) {
  const id = alvo.slice(1) + '-campo';
  $(alvo).innerHTML = itens.map(([t, on]) => `<div class="check ${on ? 'on' : ''}" role="checkbox" tabindex="0" aria-checked="${!!on}"><span class="caixa">${ic('check')}</span>${t}</div>`).join('')
    + `<form class="nova-regra"><label for="${id}">${ic('plus')}${rotulo}</label><div class="linha"><input id="${id}" placeholder="${dica}"><button class="btn btn-ouro" type="submit">${ic('plus', 'ic-sm')}Adicionar</button></div></form>`;
  $(alvo).querySelectorAll('.check').forEach(ligaCheck);
  const f = $(alvo).querySelector('.nova-regra'), campo = f.querySelector('input');
  f.onsubmit = e => {
    e.preventDefault();
    const v = campo.value.trim(); if (!v) return campo.focus();
    const c = document.createElement('div');
    c.className = 'check on'; c.setAttribute('role', 'checkbox'); c.tabIndex = 0; c.setAttribute('aria-checked', 'true');
    c.innerHTML = `<span class="caixa">${ic('check')}</span><span class="txt"></span><span class="tag-nova">Nova</span>`;
    c.querySelector('.txt').textContent = v;
    ligaCheck(c); f.before(c); f.reset();
    avisa('Regra adicionada', 'A assistente já segue essa regra nas próximas conversas.', 'check');
  };
}
function renderAssistente() {
  checks('#ch-passar', [['A cliente quer marcar ou remarcar horário fora da agenda', 1], ['Pede desconto, pacote ou condição de pagamento', 1], ['Fala de problema de saúde, alergia ou gestação', 1], ['Manda foto da pele ou do corpo', 1], ['Reclama ou pede pra falar com uma pessoa', 1], ['Pergunta algo que não está na base de conhecimento', 1]], 'Ex.: a cliente pergunta de tratamento pra homem', 'Escreva outra situação pra passar pra equipe');
  checks('#ch-nunca', [['Inventar preço, promoção ou horário', 1], ['Prometer resultado de tratamento', 1], ['Dar orientação de saúde', 1], ['Insistir depois que a cliente disse não', 1], ['Dizer que é uma pessoa, se perguntarem', 1]], 'Ex.: mandar o valor de pacote sem a Clara aprovar', 'Escreva outra coisa que ela nunca deve fazer');
  checks('#ch-quali', [['Qual tratamento procura', 1], ['Região do rosto ou do corpo', 1], ['Se já fez antes', 1], ['Melhor dia e horário', 1], ['Particular ou Wellhub', 1], ['Como conheceu a clínica', 1], ['Data de algum evento importante', 0]], 'Ex.: usa algum ácido na pele?', 'Escreva outra pergunta pra ela fazer');
  $('#salvar-regras').onclick = () => avisa('Regras salvas', 'A assistente segue o que vocês escreveram a partir da próxima mensagem.', 'check');
  const base = [['wallet', 'Formas de pagamento', 'Pix, débito e crédito em até 5x'], ['badge-check', 'Wellhub', 'Drenagem e redutora a partir do Gold+'], ['calendar-check', 'Pacotes', 'Condição especial a partir de 6 sessões'], ['map-pin', 'Endereço', 'Centro, com estacionamento em frente'], ['clock-3', 'Horário da clínica', 'Seg a sex, 8h às 19h. Sáb, 8h às 13h'], ['heart-pulse', 'Contraindicações', 'Sempre passa pra profissional']];
  $('#base').innerHTML = base.map(([i, t, s]) => `<div><b>${ic(i)}${t}</b><small>${s}</small></div>`).join('');
  document.querySelectorAll('#v-assistente .chave').forEach(c => c.onclick = () => c.classList.toggle('on'));
  document.querySelectorAll('#v-assistente [data-grupo] button').forEach(b => b.onclick = () => b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)));
  const r = semente(3);
  $('#voz-ondas').innerHTML = Array.from({ length: 22 }, () => `<i style="height:${5 + Math.round(r() * 17)}px;animation-delay:${(r() * .7).toFixed(2)}s"></i>`).join('');
  $('#voz .play').onclick = () => {
    const v = $('#voz'); if (v.classList.contains('tocando')) return;
    v.classList.add('tocando'); setTimeout(() => v.classList.remove('tocando'), 3500);
    avisa('Prévia da voz', 'Na versão de vocês, aqui toca a voz gravada pela equipe.', 'audio-lines');
  };
}

const RENDER = {
  painel: () => { renderKpis(); renderDias(); renderFunil(); renderOrigem(); renderCalor(); renderFeed(); renderVisitas(); renderTopImoveis(); },
  conversas: renderConversas, funil: renderKanban, followups: renderFollowups, imoveis: renderImoveis, equipe: renderEquipe, assistente: renderAssistente,
};

/* ---------- Simulação de um contato novo ---------- */
async function simular() {
  if (simRodando) return;
  simRodando = true; $('#btn-simular').disabled = true; $('#btn-simular').style.opacity = .6;
  const base = SIMULACOES[simIndice % SIMULACOES.length];
  const volta = Math.floor(simIndice / SIMULACOES.length);
  simIndice++;
  const corretor = rodizio.find(r => !foraRodizio.has(r)) || 'paula';
  const l = { ...base, id: base.id + volta, etapa: 'novo', status: 'ia', resp: null, quando: agoraHora(), ordem: Math.max(...LEADS.map(x => x.ordem)) + 1, nova: true, msgs: [{ dia: 'Hoje' }] };
  LEADS.unshift(l);
  avisa(`Novo contato: ${l.nome}`, `Chegou pelo ${l.origem}. A assistente já está respondendo.`, 'message-circle');
  addFeed(['message-circle', '#fbf3e2', '#8f5c0c', `Novo contato: <b>${l.nome}</b>, pelo ${l.origem}`, 'agora']);
  if (location.hash !== '#conversas') location.hash = 'conversas';
  filtro = 'todas'; document.querySelectorAll('#filtros button').forEach(x => x.classList.toggle('on', x.dataset.f === 'todas'));
  await espera(120);
  abreConversa(l.id);
  let t0 = Date.now();
  for (const passo of base.roteiro) {
    const aberta = () => selecionada === l.id && $('#mensagens');
    if (passo.de === 'cli' || passo.de === 'ia') {
      if (aberta()) { $('#mensagens').insertAdjacentHTML('beforeend', `<div class="digitando ${passo.de === 'cli' ? 'cli' : ''}" id="dig"><i></i><i></i><i></i></div>`); $('#mensagens').scrollTop = 1e6; }
      await espera(passo.serv ? 700 : passo.de === 'cli' ? 1500 : 1300);
      const d = $('#dig'); if (d) d.remove();
    } else await espera(600);
    const m = { ...passo, h: agoraHora() };
    if (m.txt) m.txt = m.txt.replace('{corretor}', EQUIPE[corretor].nome);
    l.msgs.push(m); l.quando = agoraHora();
    if (aberta()) { $('#mensagens').insertAdjacentHTML('beforeend', htmlMsg(m)); ligaAudios($('#mensagens')); $('#mensagens').scrollTop = 1e6; }
    if (passo.de === 'ia' && !passo.serv && t0) { $('#ult-resp').textContent = Math.max(2, Math.round((Date.now() - t0) / 1000)) + ' s'; t0 = 0; }
    if (passo.de === 'cli') t0 = Date.now();
    if (l.msgs.length === 5) { l.etapa = 'conversa'; }
    renderLista();
  }
  l.etapa = 'agendado'; l.status = 'eq'; l.resp = corretor; l.chegou = true;
  l.proximo = base.proximo + ', com a ' + EQUIPE[corretor].nome;
  rodizio = rodizio.filter(r => r !== corretor).concat(corretor);
  if (renderizado.equipe) renderRodizio();
  if (renderizado.funil) renderKanban();
  AGENDA.unshift([l.nome, base.proximo.replace('Sessão ', '').replace(/^./, c => c.toUpperCase()), l.serv, corretor]);
  if (renderizado.painel) renderVisitas();
  addFeed(['user-check', '#eaf0f9', '#2f5d9e', `<b>${l.nome}</b> agendou com a ${EQUIPE[corretor].nome}`, 'agora']);
  avisa(`Cliente agendada com a ${EQUIPE[corretor].nome}`, `${l.interesse}. O resumo já está na ficha.`, 'user-check');
  if (selecionada === l.id) abreConversa(l.id);
  simRodando = false; $('#btn-simular').disabled = false; $('#btn-simular').style.opacity = 1;
}
$('#btn-simular').onclick = simular;
$('#btn-sino').onclick = () => avisa('Avisos no celular', 'Cada profissional recebe no WhatsApp dela a cliente que for da vez, com o resumo.', 'bell');

/* Início */
vai();
if (new URLSearchParams(location.search).has('simular')) setTimeout(simular, 900);
