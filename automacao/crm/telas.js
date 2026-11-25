/* Telas novas do CRM da Inbox Mestre (24/11/2026): Dashboard/Vendas, Conexões, Automações,
   Disparos, Contatos, Ferramentas e Configurações. Só declara funções: elas usam R, ic, tile,
   hbar, semente e o resto, que moram em crm.js (carregado depois). Tudo aqui é dado de exemplo. */

/* ---------- Dashboard, aba Vendas ---------- */
function vendasCfg() {
  const t = {
    imobiliaria: { tempo: '18 dias', ticket: 410000, valor: 'Valor negociado', un: 'Negócios fechados', unVar: 'imóveis' },
    carros: { tempo: '6 dias', ticket: 92000, valor: 'Valor vendido', un: 'Carros vendidos', unVar: 'veículos' },
    clinica: { tempo: '3,2 dias', ticket: 1450, valor: 'Valor em pacotes', un: 'Pacotes fechados', unVar: 'pacotes' },
    moda: { tempo: '1,4 dia', ticket: 289, valor: 'Valor em pedidos', un: 'Pedidos entregues', unVar: 'pedidos' },
    restaurante: { tempo: '42 min', ticket: 62, valor: 'Valor em pedidos', un: 'Pedidos concluídos', unVar: 'pedidos' },
  };
  return t[R.id] || t.clinica;
}

function renderVendas() {
  const c = vendasCfg();
  const fechados = R.funil[R.funil.length - 1][1];
  const propostas = R.funil.length > 1 ? R.funil[R.funil.length - 2][1] : fechados;
  const rotAberto = R.funil.length > 1 ? R.funil[R.funil.length - 2][0] : 'Em aberto';
  const valor = fechados * c.ticket;
  const conv = (fechados / TOTAL * 100).toFixed(1).replace('.', ',');
  const foraFech = Math.max(1, Math.round(fechados * FORA / TOTAL * 1.15));
  const k = [
    ['wallet', c.valor, brl(valor), '9% a mais que no mês anterior'],
    ['badge-check', c.un, fechados, '12% a mais que no mês anterior'],
    ['tag', 'Ticket médio', brl(c.ticket), 'por ' + c.unVar.replace(/s$/, '')],
    ['trending-up', 'Taxa de conversão', conv + '%', 'dos contatos viraram fechamento'],
    ['moon', 'Fechados de conversa fora do horário', foraFech, 'começaram quando ninguém atendia'],
    ['timer', 'Tempo até fechar', c.tempo, 'do primeiro contato ao fechamento'],
    ['clipboard-list', rotAberto + ' (em aberto)', propostas, 'esperando fechar'],
    ['circle-dollar-sign', 'Valor em aberto', brl(propostas * c.ticket), 'se todos fecharem'],
  ];
  $('#vd-kpis').innerHTML = k.map(([i, r, n, v]) => `<div class="card kpi"><div class="rot">${tile(i, 'painel')}${r}</div><div class="num">${n}</div><div class="var">${v}</div></div>`).join('');

  /* fechamentos por dia: espalha o total do mês, mais forte no fim da semana */
  const r = semente(33), serie = [];
  let resto = fechados;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const peso = (d.getDay() === 0 ? .35 : d.getDay() === 6 ? 1.4 : 1) * (.5 + r());
    serie.push({ d, peso, n: 0 });
  }
  const soma = serie.reduce((s, x) => s + x.peso, 0);
  serie.forEach(x => { x.n = Math.min(resto, Math.floor(fechados * x.peso / soma)); resto -= x.n; });
  for (let i = 0; resto > 0; i = (i + 7) % 30) { serie[i].n++; resto--; }
  const W = 680, H = 210, mL = 30, mB = 24, mT = 8, pw = W - mL - 4, ph = H - mB - mT;
  const max = Math.max(4, Math.ceil(Math.max(...serie.map(x => x.n)) / 2) * 2);
  const bw = pw / serie.length, w = bw - 4, y = v => mT + ph - v / max * ph;
  let s = '';
  for (let g = 0; g <= max; g += max / 4) s += `<line x1="${mL}" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="#EEEEE9"/><text x="${mL - 6}" y="${y(g) + 4}" text-anchor="end">${Math.round(g)}</text>`;
  serie.forEach((x, i) => {
    const x0 = mL + i * bw + 2, h = x.n ? Math.max(4, ph * x.n / max) : 0;
    if (h) s += `<rect x="${x0}" y="${mT + ph - h}" width="${w}" height="${h}" rx="4" fill="#1FAF6B"/>`;
    if (i % 5 === 4 || i === 29) s += `<text x="${x0 + w / 2}" y="${H - 6}" text-anchor="middle">${i === 29 ? 'Hoje' : x.d.getDate() + '/' + (x.d.getMonth() + 1)}</text>`;
    s += `<rect class="hit" data-i="${i}" x="${mL + i * bw}" y="${mT}" width="${bw}" height="${ph}" fill="transparent"/>`;
  });
  $('#vd-dias').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fechamentos por dia nos últimos 30 dias">${s}</svg>`;
  $('#vd-dias').querySelectorAll('.hit').forEach(h => {
    h.addEventListener('mousemove', e => { const x = serie[h.dataset.i]; mostraDica(`<b>${x.d.getDate()}/${x.d.getMonth() + 1}</b><br>${x.n} fechamento${x.n === 1 ? '' : 's'}`, e); });
    h.addEventListener('mouseleave', escondeDica);
  });
  $('#vd-r').innerHTML = `<span>Total: <b>${fechados}</b></span><span>Melhor dia: <b>${Math.max(...serie.map(x => x.n))}</b> de uma vez</span>`;

  const linhas = R.tabEq.map(([p, , , , fe]) => [EQUIPE[p].nome, fe, '', EQUIPE[p].cor]);
  hbar($('#vd-resp'), linhas, fechados);
  hbar($('#vd-origem'), R.origem.map(([n, f, cor]) => [n, Math.max(1, Math.round(fechados * f)), '', cor]), fechados);

  $('#vd-trouxe').innerHTML = `<div class="vd-trouxe-num">${FORA}<small>contatos chegaram fora do horário nos últimos 30 dias, e a assistente respondeu todos em 9 s na média.</small></div>
    <div class="dado" style="margin-top:12px"><span>Fechamentos dessas conversas</span><b>${foraFech}</b></div>
    <div class="dado"><span>Valor aproximado</span><b>${brl(foraFech * c.ticket)}</b></div>`;

  const resp = LEADS.filter(l => situacao(l) === 'responder').length;
  const dicas = [
    ['message-circle', resp ? `<b>${resp} conversa${resp === 1 ? '' : 's'}</b> esperando a equipe agora. Quem responde rápido fecha mais.` : 'Nenhuma conversa esperando a equipe agora.'],
    ['repeat', `<b>${FOLLOWUPS.filter(f => f.st === 'ag').length} follow-ups</b> saem sozinhos nos próximos dias, só em horário comercial.`],
    ['star', 'Peça avaliação no Google depois de cada atendimento: a assistente já faz isso por você.'],
  ];
  $('#vd-dicas').innerHTML = dicas.map(([i, t]) => `<div class="vd-dica">${tile(i, 'painel')}<div>${t}</div></div>`).join('');
}

function ligaAbasPainel() {
  const abas = document.querySelectorAll('.abas-pill [data-pa]');
  abas.forEach(b => b.onclick = () => {
    abas.forEach(x => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('.painel-aba').forEach(p => p.classList.toggle('ativa', p.id === 'pa-' + b.dataset.pa));
    if (b.dataset.pa === 'vendas' && !renderizado.vendas) { renderVendas(); renderizado.vendas = true; }
  });
}

/* ---------- Conexões ---------- */
function renderConexoes() {
  $('#con-sub').textContent = R.central;
  $('#con-nome').textContent = R.empresa;
  const canais = [['at-sign', 'Instagram Direct', 'Mensagens do perfil na mesma caixa'], ['message-circle', 'Messenger', 'Conversas da página do Facebook'], ['globe', 'Chat do site', 'Botão de conversa na sua página']];
  $('#con-canais').innerHTML = canais.map(([i, t, d]) => `<div class="canal">${tile(i, 'painel')}<div><b>${t}</b><small>${d}</small></div><span class="chip">Em breve</span></div>`).join('');
  ligaAvisos();
}

/* ---------- Automações ---------- */
function renderAutoGrade() {
  const a = [
    ['repeat', 'Follow-up automático', 'Três toques em sete dias pra quem parou de responder, cada um escrito lendo a conversa.', true, `Enviados no mês: <b>${R.fuKpi[0]}</b>`],
    ['calendar-check', 'Lembrete de horário', 'Um dia antes, confirma com o contato e avisa a equipe se ele desmarcar.', true, 'Confirmações no mês: <b>31</b>'],
    ['star', 'Pedido de avaliação no Google', 'Depois do atendimento, a assistente pede a avaliação com o link direto.', true, 'Avaliações pedidas: <b>24</b>'],
    ['clipboard-list', 'Pesquisa de satisfação', 'Pergunta uma nota de 0 a 10 e guarda a resposta na ficha do contato.', true, 'Nota média: <b>9,1</b>'],
    ['moon', 'Mensagem fora do horário', 'Quem escreve de noite ou no domingo recebe resposta na hora e a equipe vê de manhã.', true, `Atendidos fora do horário: <b>${FORA}</b>`],
    ['bar-chart-3', 'Relatório mensal no WhatsApp', 'No primeiro dia do mês, o dono recebe um resumo do que a assistente fez.', false, 'Próximo envio: <b>dia 1º</b>'],
  ];
  $('#auto-grade').innerHTML = a.map(([i, t, d, on, rod]) => `<div class="card auto-card"><div class="topo-card">${tile(i, 'fu')}<b id="au-${i}">${t}</b><button class="chave" role="switch" aria-checked="${on}" aria-labelledby="au-${i}"></button></div><p>${d}</p><div class="rodape">${rod}</div></div>`).join('');
  $('#auto-grade').querySelectorAll('.chave').forEach(c => c.onclick = () => c.setAttribute('aria-checked', c.getAttribute('aria-checked') !== 'true'));
}

/* ---------- Disparos ---------- */
function renderDisparos() {
  const k = [['megaphone', 'Campanhas no mês', 3, 'só com modelo aprovado', 'fu'], ['send', 'Mensagens enviadas', 342, 'dentro do horário comercial', 'conv'], ['message-circle', 'Responderam', 87, '25% dos enviados', 'serv'], ['ban', 'Pediram pra sair', 2, 'já fora da lista', 'eq']];
  $('#dp-kpis').innerHTML = k.map(([i, r, n, v, c]) => `<div class="card kpi"><div class="rot">${tile(i, c)}${r}</div><div class="num">${n}</div><div class="var">${v}</div></div>`).join('');
  const chip = { ok: `<span class="chip chip-ia">${ic('check')}Concluída</span>`, ag: `<span class="chip chip-fu">${ic('clock-3')}Agendada</span>`, rasc: `<span class="chip">Rascunho</span>` };
  const c = [
    ['Reativar contatos parados há 30 dias', 'reativar_contato', 'Quem autorizou receber', 118, 31, 'ok', 'Ter, 18/11'],
    ['Confirmação de horário marcado', 'lembrete_horario', 'Quem tem horário na semana', 164, 96, 'ok', 'Qui, 20/11'],
    ['Novidades da semana', 'novidades_semana', 'Quem pediu novidades', 60, 0, 'ag', 'Sex, 28/11'],
  ];
  $('#tab-dp').innerHTML = '<tr><th>Campanha</th><th>Modelo aprovado</th><th>Público</th><th>Enviadas</th><th>Responderam</th><th>Situação</th><th>Data</th></tr>'
    + c.map(([n, m, p, e, r, st, d]) => `<tr><td><b>${n}</b></td><td><code>${m}</code></td><td>${p}</td><td>${e}</td><td>${st === 'ag' ? '–' : r + ' (' + Math.round(r / e * 100) + '%)'}</td><td>${chip[st]}</td><td>${d}</td></tr>`).join('');
  ligaAvisos();
}

/* ---------- Contatos ---------- */
function renderContatos() {
  const lista = () => {
    const q = norm($('#busca-ct').value.trim());
    const ls = LEADS.filter(l => !q || norm(l.nome).includes(q) || norm(l.tel).includes(q) || norm(l.interesse || '').includes(q));
    $('#ct-sub').textContent = ls.length + (ls.length === 1 ? ' contato' : ' contatos') + ' na demonstração';
    $('#tab-ct').innerHTML = '<tr><th>Contato</th><th>Origem</th><th>Interesse</th><th>Etapa</th><th>Responsável</th><th>Valor</th><th>Último contato</th></tr>'
      + ls.map(l => {
        const e = ETAPAS.find(x => x.id === l.etapa) || ETAPAS[0];
        return `<tr class="clic" tabindex="0" data-id="${l.id}"><td class="nome">${avContato(l)}<div>${esc(l.nome)}<small>${esc(l.tel)}</small></div></td><td>${esc(l.origem)}</td><td style="white-space:normal;min-width:200px">${esc(l.interesse || '')}</td><td><span class="cel-etapa" style="--cor:${e.cor}"><i></i>${e.nome}</span></td><td>${l.resp ? EQUIPE[l.resp].nome : 'Assistente'}</td><td>${l.valor ? brl(l.valor) : '–'}</td><td>${l.quando || ''}</td></tr>`;
      }).join('') || '<tr><td style="padding:22px 20px;color:var(--suave)">Nenhum contato com essa busca.</td></tr>';
    $('#tab-ct').querySelectorAll('tr.clic').forEach(t => {
      const abre = () => { location.hash = 'conversas'; setTimeout(() => abreConversa(t.dataset.id), 80); };
      t.onclick = abre; t.onkeydown = e => { if (e.key === 'Enter') abre(); };
    });
  };
  $('#busca-ct').addEventListener('input', lista);
  lista();
}

/* ---------- Ferramentas ---------- */
function renderFerramentas() {
  const f = [
    ['star', 'Pedido de avaliação no Google', 'Depois do atendimento, a assistente pede a avaliação com o link direto.', 'plano', 'automacoes'],
    ['clipboard-list', 'Pesquisa de satisfação', 'Nota de 0 a 10 depois do atendimento, guardada na ficha do contato.', 'plano', 'automacoes'],
    ['calendar-check', 'Agendamento pela conversa', 'O contato escolhe o horário no próprio WhatsApp e a equipe vê na agenda.', 'plano', 'automacoes'],
    ['bar-chart-3', 'Relatório mensal no WhatsApp', 'O dono recebe no celular o resumo do mês, sem abrir o sistema.', 'plano', 'automacoes'],
    ['message-square-quote', 'Respostas rápidas', 'Atalhos pra equipe responder o que se repete, com um toque.', 'plano', 'config:respostas'],
    ['layout-template', 'Modelos de mensagem', 'Os textos aprovados pela Meta para campanhas e lembretes.', 'plano', 'config:templates'],
    ['qr-code', 'Link e QR code rastreáveis', 'Mostra de qual anúncio, panfleto ou cartaz veio cada conversa.', 'breve'],
    ['target', 'Meta Ads: de qual anúncio veio', 'Liga o contato ao anúncio que ele clicou, pra saber o que dá resultado.', 'breve'],
    ['at-sign', 'Instagram Direct', 'As mensagens do perfil caem na mesma caixa de conversas.', 'breve'],
    ['calendar-days', 'Google Agenda', 'Os horários marcados na conversa viram evento na sua agenda.', 'breve'],
    ['hand-coins', 'Cobrança por Pix', 'Manda o link de pagamento dentro da conversa e confere quando pagou.', 'breve'],
    ['webhook', 'Webhooks e API', 'Liga o Inbox Mestre ao sistema que a sua empresa já usa.', 'breve'],
  ];
  $('#ferr-grade').innerHTML = f.map(([i, t, d, st, ir]) => `<div class="card ferr ${st === 'breve' ? 'breve' : ''}"><span class="tile">${ic(i)}</span><b>${t}${st === 'breve' ? '<span class="chip">Em breve</span>' : '<span class="chip chip-ia">No plano</span>'}</b><p>${d}</p>${st === 'plano' ? `<button class="btn" data-ir="${ir}">Abrir ${ic('arrow-right', 'ic-sm')}</button>` : `<button class="btn btn-leve" data-aviso="Esta integração está no mapa. Quem pedir primeiro, entra primeiro.">Quero essa</button>`}</div>`).join('');
  $('#ferr-grade').querySelectorAll('[data-ir]').forEach(b => b.onclick = () => {
    const [v, p] = b.dataset.ir.split(':');
    if (p) cfgPane = p;
    if (location.hash === '#' + v) vai(); else location.hash = v;
  });
  ligaAvisos();
}

/* ---------- Configurações ---------- */
let cfgPane = 'perfil';
const idPane = p => p === 'assistente' ? 'v-assistente' : 'p-' + p;
function abreCfg(p) {
  cfgPane = p;
  document.querySelectorAll('.cfg-pane').forEach(x => x.classList.toggle('ativa', x.id === idPane(p)));
  document.querySelectorAll('.cfg-nav button').forEach(b => { if (b.dataset.p === p) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
}

function renderConfig() {
  renderEquipe(); renderAssistente();
  $('#pf-nome').value = EQUIPE[R.logado].nome;
  $('#pf-av').textContent = EQUIPE[R.logado].sigla; $('#pf-av').style.background = EQUIPE[R.logado].cor;

  const inclui = ['900 conversas por mês', 'IA consultora no CRM', 'CRM com a sua logo e as suas cores', 'Painel de gestão', 'Relatório mensal no WhatsApp', 'Ajuste mensal da assistente'];
  $('#p-plano').innerHTML = `<div class="plano-topo"><img class="pixel" src="img/nivel-3.png" width="62" height="79" alt=""><div><h2>Plano Avançado</h2><p>Nível 3 · renova todo mês no cartão</p></div><div class="preco">R$ 797<small>por mês</small></div></div>
    <div class="card"><div class="card-cab"><div><h2>Uso neste mês</h2><p>Conversas atendidas pela assistente</p></div></div><div class="card-corpo"><div class="uso-barra"><i style="width:35%"></i></div><p class="nota-uso"><b>312</b> de 900 conversas. Faltam 14 dias pra renovar.</p></div></div>
    <div class="card"><div class="card-cab"><div><h2>O que o plano inclui</h2></div></div><div class="card-corpo"><div class="checks" style="grid-template-columns:repeat(2,minmax(0,1fr))">${inclui.map(t => `<div class="check fixo"><span class="caixa">${ic('check')}</span><span class="txt">${t}</span></div>`).join('')}</div>
    <div class="linha-btn"><button class="btn" data-aviso="Na demonstração o plano é de exemplo.">${ic('refresh-cw', 'ic-sm')}Mudar de plano</button><button class="btn btn-leve" data-aviso="Na demonstração as faturas são de exemplo.">${ic('receipt', 'ic-sm')}Ver faturas</button></div></div></div>`;

  const n = [['Avisar no WhatsApp quem for da vez', 'Recebe o contato novo com o resumo da conversa', true], ['Lembrar de conversa esperando há mais de 10 minutos', 'Só em horário comercial', true], ['Resumo do dia às 18h', 'O que a assistente atendeu e o que ficou pra amanhã', false], ['Aviso de avaliação nova no Google', 'Pra responder rápido', true]];
  $('#p-notificacoes').innerHTML = `<div class="card"><div class="card-cab"><div><h2>Notificações</h2><p>Escolha o que chega no seu celular</p></div></div><div class="card-corpo">${n.map(([t, d, on], i) => `<div class="opcao"><div><b id="nt-${i}">${t}</b><small>${d}</small></div><button class="chave" role="switch" aria-checked="${on}" aria-labelledby="nt-${i}"></button></div>`).join('')}</div></div>`;
  $('#p-notificacoes').querySelectorAll('.chave').forEach(c => c.onclick = () => c.setAttribute('aria-checked', c.getAttribute('aria-checked') !== 'true'));

  const rr = [['/horario', `Atendemos de segunda a sexta, das 8h às 18h, e aos sábados até o meio-dia. Fora disso a ${R.empresa} responde assim que abrir.`], ['/endereco', 'Estamos na Rua das Flores, 120, Centro. Tem estacionamento ao lado.'], ['/pix', 'Pode pagar por Pix. Mando a chave aqui e confiro assim que cair.'], ['/obrigado', 'Obrigado pelo contato! Qualquer dúvida é só chamar por aqui.']];
  $('#p-respostas').innerHTML = `<div class="card"><div class="card-cab"><div><h2>Respostas rápidas</h2><p>A equipe digita a barra e o atalho na conversa</p></div><button class="dir btn btn-pri" data-aviso="Na demonstração as respostas são de exemplo.">${ic('plus', 'ic-sm')}Nova resposta</button></div><div class="card-corpo">${rr.map(([a, t]) => `<div class="resp-rapida"><code>${a}</code><p>${t}</p></div>`).join('')}</div></div>`;

  const md = [['confirmacao_atendimento', 'Utilidade', 'ok', 'Olá, {{1}}! Recebemos o seu contato e já estamos cuidando. Qualquer coisa é só responder aqui.'], ['lembrete_horario', 'Utilidade', 'ok', 'Oi, {{1}}! Passando pra lembrar do seu horário amanhã, às {{2}}. Pode confirmar?'], ['reativar_contato', 'Marketing', 'ok', 'Oi, {{1}}! Faz um tempo que a gente não se fala. Ainda posso te ajudar com {{2}}?'], ['pesquisa_satisfacao', 'Utilidade', 'an', 'Como foi o seu atendimento, {{1}}? Responda com uma nota de 0 a 10.'], ['novidades_semana', 'Marketing', 'rasc', 'Oi, {{1}}! Chegaram novidades esta semana. Quer ver?']];
  const st = { ok: '<span class="chip chip-ia">Aprovado</span>', an: '<span class="chip chip-warn">Em análise</span>', rasc: '<span class="chip">Rascunho</span>' };
  $('#p-templates').innerHTML = `<div class="card"><div class="card-cab"><div><h2>Modelos de mensagem</h2><p>Textos que a Meta aprova antes de você poder mandar em lote ou puxar conversa</p></div><button class="dir btn btn-pri" data-aviso="Na demonstração os modelos são de exemplo.">${ic('plus', 'ic-sm')}Novo modelo</button></div><div class="card-corpo">${md.map(([n, cat, s, t]) => `<div class="modelo"><b>${n}</b>${st[s]}<small>Categoria: ${cat}</small><div class="msg-modelo">${t}</div></div>`).join('')}</div></div>`;

  document.querySelectorAll('.cfg-nav button').forEach(b => b.onclick = () => abreCfg(b.dataset.p));
  ligaAvisos();
}

/* Botões de exemplo: avisam em vez de fingir que fizeram */
function ligaAvisos() {
  document.querySelectorAll('[data-aviso]:not([data-ligado])').forEach(b => {
    b.dataset.ligado = '1';
    b.addEventListener('click', () => avisa('Demonstração', b.dataset.aviso, 'info'));
  });
}
