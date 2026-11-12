/* Painel de demonstração do atendimento com IA (21/10/2026).
   Adaptado do CRM da Bruno Repolês (clientes/BrunoRepoles/site/crm/). Tudo aqui é inventado: nomes,
   valores e conversas.
   11/11/2026: cara nova da Inbox Mestre (Balcão branco), caixa Em aberto, Estratégia (a IA sugere,
   nunca envia), ficha editável e simulação honesta (a IA passa pra equipe no preço, sem voz).
   12/11/2026: alternador de ramo. Os dados de cada negócio moram em ramos/<id>.js (window.RAMO) e
   este arquivo só desenha: clínica de estética, imobiliária, loja de carros, calçados e roupas,
   restaurante. A escolha vai em ?ramo=<id>. */

const R = window.RAMO;
const EQUIPE = R.equipe;
let rodizio = [...R.rodizio];
const foraRodizio = new Set();
const SERV = R.itens;
const precoTxt = s => s.precoT;
const ETAPAS = R.etapas;
const ETAPA_NOVO = ETAPAS[0].id, ETAPA_CONVERSA = ETAPAS[1].id, ETAPA_FIM = ETAPAS[ETAPAS.length - 1].id;
const LEADS = R.leads;
const SIMULACOES = R.sims;
let simIndice = 0;
let simRodando = false;


/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s);
const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const valorCurto = l => l.valor ? brl(l.valor) : '';
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const espera = ms => new Promise(r => setTimeout(r, ms));
const agoraHora = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function semente(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* Rosto da IA: a cabeça do camaleão de frente, sorrindo (identidade/mascote/ da Inbox Mestre) */
const MASCOTE = 'img/cabeca-frente-32.png';
const tile = (i, c) => `<span class="tile" style="--cor:var(--c-${c})">${ic(i)}</span>`;
const avIA = () => `<span class="avatar av-ia"><img src="${MASCOTE}" width="24" height="24" alt=""></span>`;
/* Foto do perfil da cliente sempre (sem foto, a inicial, como no WhatsApp). Quando a IA está
   respondendo, o camaleão entra num selo no canto de baixo à direita, cobrindo uns 20% da foto. */
const avContato = l => `<span class="av-wrap">${l.foto ? `<img class="avatar" src="${l.foto}" alt="">` : `<span class="avatar av-ini" aria-hidden="true">${l.nome[0]}</span>`}${comIA(l) ? `<span class="selo-ia" title="A assistente está respondendo"><img src="img/cabeca-frente-16.png" width="16" height="16" alt="A assistente está respondendo"></span>` : ''}</span>`;
const avEquipe = r => `<span class="avatar" style="background:${EQUIPE[r].cor}" title="${EQUIPE[r].nome}">${EQUIPE[r].sigla}</span>`;
const comIA = l => l.status === 'ia' || l.status === 'ag';

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
const TITULOS = { painel: 'Painel', conversas: 'Conversas', funil: 'Funil', followups: 'Follow-ups', servicos: R.v.itensTit, equipe: 'Equipe e rodízio', assistente: 'Regras da assistente' };
const renderizado = {};
function vai() {
  let v = location.hash.replace('#', '') || 'painel';
  if (!TITULOS[v]) v = 'painel';
  document.querySelectorAll('.vista').forEach(s => s.classList.toggle('ativa', s.id === 'v-' + v));
  document.querySelectorAll('[data-v]').forEach(a => { const on = a.dataset.v === v; a.classList.toggle('ativo', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#titulo').textContent = TITULOS[v];
  if (!renderizado[v]) { RENDER[v](); renderizado[v] = true; }
  if (v === 'conversas' && !selecionada && innerWidth > 980) { const p = primeiraEmAberto(); if (p) abreConversa(p.id); }
  if (v !== 'conversas') document.body.classList.remove('chat-cheio');
  $('.conteudo').scrollTop = 0; window.scrollTo(0, 0);
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
    ['message-circle', 'Contatos em 30 dias', TOTAL, '12% a mais que no mês anterior', 'conv'],
    ['bot', 'Respondidos pela assistente', '100%', 'nenhum contato sem resposta', 'regras'],
    ['timer', 'Primeira resposta', '9 s', 'em média, 24 horas por dia', 'eq'],
    ['moon', 'Chegaram fora do horário', FORA, Math.round(FORA / TOTAL * 100) + '% dos contatos', 'painel'],
    [...R.kpiAg, 'serv'],
    ['user-check', 'Passadas à equipe', 48, 'já com o resumo', 'funil'],
  ];
  $('#kpis').innerHTML = k.map(([i, r, n, v, c]) => `<div class="card kpi"><div class="rot">${tile(i, c)}${r}</div><div class="num">${n}</div><div class="var">${v}</div></div>`).join('');
}

function renderDias() {
  const W = 680, H = 230, mL = 30, mB = 24, mT = 8, pw = W - mL - 4, ph = H - mB - mT;
  const max = Math.ceil(Math.max(...DIAS.map(x => x.com + x.fora)) / 5) * 5;
  const bw = pw / DIAS.length, gap = 3, w = bw - gap;
  const y = v => mT + ph - (v / max) * ph;
  let s = '';
  for (let g = 0; g <= max; g += max / 4) s += `<line x1="${mL}" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="#EEF0F4" stroke-width="1"/><text x="${mL - 6}" y="${y(g) + 4}" text-anchor="end">${g}</text>`;
  DIAS.forEach((x, i) => {
    const x0 = mL + i * bw + gap / 2;
    const yCom = y(x.com), yTop = y(x.com + x.fora);
    s += `<rect x="${x0}" y="${yCom}" width="${w}" height="${mT + ph - yCom}" fill="#5EC4B6"/>`;
    const h2 = Math.max(yCom - yTop - 2, 0), r = Math.min(3, w / 2, h2);
    s += `<path d="M${x0},${yCom - 2} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + w - r} Q${x0 + w},${yTop} ${x0 + w},${yTop + r} V${yCom - 2} Z" fill="#1B2559"/>`;
    if (i % 5 === 4 || i === 29) s += `<text x="${x0 + w / 2}" y="${H - 6}" text-anchor="middle">${i === 29 ? 'Hoje' : x.d.getDate() + '/' + (x.d.getMonth() + 1)}</text>`;
    s += `<rect class="hit" data-i="${i}" x="${mL + i * bw}" y="${mT}" width="${bw}" height="${ph}" fill="transparent"/>`;
  });
  $('#g-dias').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Contatos por dia nos últimos 30 dias">${s}</svg>`;
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  $('#g-dias').querySelectorAll('.hit').forEach(h => {
    h.addEventListener('mousemove', e => { const x = DIAS[h.dataset.i]; mostraDica(`<b>${nomes[x.d.getDay()]}, ${x.d.getDate()}/${x.d.getMonth() + 1}</b><br>${R.horario}: ${x.com}<br>Fora do horário: ${x.fora}<br>Total: ${x.com + x.fora}`, e); });
    h.addEventListener('mouseleave', escondeDica);
  });
  $('#r-dias').innerHTML = `<span>${R.horario}: <b>${TOTAL - FORA}</b></span><span>Fora do horário: <b>${FORA}</b> (${Math.round(FORA / TOTAL * 100)}%)</span><span>Média: <b>${Math.round(TOTAL / 30)}</b> por dia</span>`;
}

function hbar(alvo, linhas, base) {
  const max = Math.max(...linhas.map(l => l[1]));
  alvo.innerHTML = linhas.map(([n, v, extra, cor]) => `<div class="hbar-linha" data-n="${n}" data-v="${v}"><span class="nome">${n}</span><span class="trilho"><span class="barra" style="width:0;${cor ? '--cor:' + cor : ''}" data-w="${v / max * 100}"></span></span><span class="val">${v}${extra ? `<small>${extra}</small>` : ''}</span></div>`).join('');
  void alvo.offsetWidth;
  setTimeout(() => alvo.querySelectorAll('.barra').forEach(b => b.style.width = b.dataset.w + '%'), 60);
  alvo.querySelectorAll('.hbar-linha').forEach(l => {
    l.addEventListener('mousemove', e => mostraDica(`<b>${l.dataset.n}</b><br>${l.dataset.v}${base ? ` de ${base} (${Math.round(l.dataset.v / base * 100)}%)` : ''}`, e));
    l.addEventListener('mouseleave', escondeDica);
  });
}

function renderFunil() {
  const q = Math.round(TOTAL * .55);
  const linhas = [['Contatos', TOTAL, '#94A3B8'], ['Em conversa', q, '#3B82F6'], ...R.funil];
  hbar($('#g-funil'), linhas.map(([n, v, c]) => [n, v, Math.round(v / TOTAL * 100) + '%', c]), TOTAL);
}

function renderOrigem() {
  const p = R.origem;
  hbar($('#g-origem'), p.map(([n, f, c]) => [n, Math.round(TOTAL * f), '', c]), TOTAL);
}

function renderCalor() {
  const horas = ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const r = semente(21);
  const util = [1, 4, 5, 7, 5, 6, 8, 8, 5], fds = [1, 3, 6, 5, 3, 3, 5, 8, 6];
  const m = dias.map((_, d) => horas.map((_, h) => Math.round((d < 5 ? util[h] : fds[h]) * (d === 6 ? .8 : 1) * (.8 + r() * .45))));
  const max = Math.max(...m.flat());
  const rampa = ['#E6F7F4', '#BDEBE3', '#7FD6C8', '#2FB5A3', '#0F766E'];
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
  $('#r-calor').innerHTML = `Pico: <b style="color:var(--tinta)">${nomes[pico.d]}, ${horas[pico.h]} às ${parseInt(horas[pico.h]) + 2}h</b>`;
}

/* [ícone, tipo (dá a cor), texto, quando] */
const COR_FEED = { ia: '#12684F', eq: '#2563EB', fu: '#DB2777', tag: '#EA580C', fim: '#64748B', ok: '#16A34A' };
const FEED = [...R.feed];
function itemFeed([i, tipo, t, q], novo) { return `<div class="feed-item ${novo ? 'novo' : ''}"><span class="bola" style="--cor:${COR_FEED[tipo] || COR_FEED.fim}">${ic(i)}</span><div>${t}<small>${q}</small></div></div>`; }
function renderFeed() { $('#feed').innerHTML = FEED.slice(0, 5).map(f => itemFeed(f)).join(''); }
function addFeed(f) { FEED.unshift(f); if (renderizado.painel) $('#feed').innerHTML = FEED.slice(0, 5).map((x, i) => itemFeed(x, i === 0)).join(''); }

const AGENDA = R.agenda;
function renderAgenda() {
  $('#agenda').innerHTML = AGENDA.map(([n, q, sv, r]) => { const s = SERV[sv], p = EQUIPE[r]; return `<div class="feed-item"><img src="${s.foto}" alt="" style="width:44px;height:34px;object-fit:cover;border-radius:6px"><div><b>${n}</b> · ${s.nome}<small>${q} ${R.v.agendaCom} ${p.nome}</small></div></div>`; }).join('');
}

function renderTopServ() {
  const lista = Object.values(SERV).sort((a, b) => b.procuras - a.procuras).slice(0, 5);
  $('#top-serv').innerHTML = lista.map(s => `<div class="top-serv-item"><img src="${s.foto}" alt=""><div><b>${s.nome}</b><small>${s.cat} · ${precoTxt(s)}</small></div><div class="n">${s.procuras}<small>pedidos</small></div></div>`).join('');
}

/* ---------- Conversas ---------- */
let selecionada = null, filtro = 'aberto', busca = '', aba = 'estr';

/* Caixa "Em aberto", como no CRM real (projetos/CRM, 27/10/2026): quem precisa de alguém da
   equipe vem primeiro. "Precisa de você" = está com a equipe e a última fala é da cliente.
   "Não precisa responder" tira da fila até ela escrever de novo. */
const ultimaFala = l => [...l.msgs].reverse().find(m => m.de && m.de !== 'sis');
function situacao(l) {
  if (l.status === 'fim') return null;
  if (l.status === 'eq') { const u = ultimaFala(l); return u && u.de === 'cli' && !l.dispensada ? 'responder' : 'equipe'; }
  return 'ia';
}
const GRUPOS = [
  ['responder', 'Precisa de você', 'Quem escreveu ainda não teve resposta de ninguém da equipe', '#F97316'],
  ['equipe', 'Com a equipe', 'Alguém da equipe já respondeu e está esperando o contato', '#2563EB'],
  ['ia', 'A assistente está conduzindo', 'Ela responde sozinha. Abra só pra acompanhar', '#1FAF6B'],
];
const FILTROS = {
  aberto: l => !!situacao(l),
  naolidas: l => l.naoLidas > 0,
  ia: comIA,
  eq: l => l.status === 'eq',
  todas: () => true,
};
const porOrdem = (a, b) => b.ordem - a.ordem;
const precisam = () => LEADS.filter(l => situacao(l) === 'responder');
const primeiraEmAberto = () => precisam().sort(porOrdem)[0] || LEADS.filter(FILTROS.aberto).sort(porOrdem)[0];
function atualizaContador() {
  const n = precisam().length || '';
  $('#cont-conv').textContent = n; $('#cont-conv-m').textContent = n;
  $('#rd-titulo').textContent = n ? `${n} ${n > 1 ? 'conversas precisam' : 'conversa precisa'} de você` : 'Nenhuma conversa esperando a equipe';
}

function chipStatus(l) {
  if (l.status === 'ia') return `<span class="chip chip-ia">IA atendendo</span>`;
  if (l.status === 'ag') return `<span class="chip chip-fu">${ic('repeat')}IA no follow-up</span>`;
  if (l.status === 'eq') return `<span class="chip chip-eq">Com ${EQUIPE[l.resp].nome}</span>`;
  return `<span class="chip">Encerrada</span>`;
}
function previa(l) {
  const m = ultimaFala(l);
  if (!m) return '';
  const quem = m.de === 'ia' ? 'Assistente: ' : m.de === 'eq' ? EQUIPE[m.quem].nome + ': ' : '';
  return quem + (m.audio ? 'Áudio (' + m.audio + ')' : m.serv ? 'Serviço: ' + SERV[m.serv].nome : m.txt);
}
const bate = l => !busca || norm([l.nome, l.interesse, previa(l), l.serv ? SERV[l.serv].nome : ''].join(' ')).includes(norm(busca));

function itemConv(l) {
  const sit = situacao(l), ia = comIA(l);
  const cls = ['conv', ia ? 'ia' : '', l.id === selecionada ? 'sel' : '', l.naoLidas ? 'nao-lida' : '', l.nova ? 'nova' : ''].join(' ');
  const marca = sit === 'responder' ? `<span class="chip chip-warn">${ic('clock-3')}Esperando desde ${l.quando}</span><span class="chip chip-eq">Com ${EQUIPE[l.resp].nome}</span>` : chipStatus(l);
  return `<div class="${cls}"><button class="conv-abre" data-id="${l.id}" ${l.id === selecionada ? 'aria-current="true"' : ''}>${avContato(l)}<span class="meio">
    <span class="l1"><b>${l.nome}</b><time>${l.quando}</time></span>
    <span class="l2"><span class="prev">${previa(l)}</span>${l.naoLidas ? `<span class="bolinha" aria-label="${l.naoLidas} não lida">${l.naoLidas}</span>` : ''}</span>
    <span class="l3">${marca}</span></span></button>${sit === 'responder' ? `<button class="dispensar" data-dispensar="${l.id}" title="O contato não está esperando resposta. A conversa volta pra cá se ele escrever de novo">${ic('check')}Não precisa responder</button>` : ''}</div>`;
}

function renderLista() {
  const ls = LEADS.filter(l => FILTROS[filtro](l) && bate(l)).sort(porOrdem);
  let html;
  if (filtro === 'aberto') html = GRUPOS.map(([k, nome, expl, cor]) => { const g = ls.filter(l => situacao(l) === k); return g.length ? `<div class="grupo-cab" title="${expl}" style="--cor:${cor}">${nome} <span class="n">${g.length}</span></div>` + g.map(itemConv).join('') : ''; }).join('');
  else html = ls.map(itemConv).join('');
  $('#convs').innerHTML = html || `<p class="lista-vazia">${busca ? `Nenhuma conversa com "${esc(busca)}".` : 'Nenhuma conversa aqui.'}</p>`;
  $('#convs').querySelectorAll('.conv-abre').forEach(b => b.onclick = () => abreConversa(b.dataset.id));
  $('#convs').querySelectorAll('[data-dispensar]').forEach(b => b.onclick = () => dispensa(b.dataset.dispensar));
  atualizaContador();
}

function dispensa(id) {
  const l = LEADS.find(x => x.id === id); if (!l) return;
  l.dispensada = true; l.naoLidas = 0;
  avisa('Saiu da fila', `${l.nome} volta pra "Precisa de você" se escrever de novo.`, 'check');
  renderLista();
  if (selecionada === id) renderFicha(l);
}

function htmlMsg(m) {
  if (m.dia) return `<div class="dia">${m.dia}</div>`;
  if (m.de === 'sis') return `<div class="msg sis">${ic(m.ic || 'info')}<span>${m.txt}</span></div>`;
  const out = m.de !== 'cli';
  const autor = m.de === 'ia' ? `<div class="autor ia"><img src="img/cabeca-frente-16.png" width="16" height="16" alt="">Assistente</div>` : m.de === 'eq' ? `<div class="autor eq">${ic('user')}${EQUIPE[m.quem].nome}</div>` : '';
  const hora = `<div class="hora">${m.h || ''}${out ? ic('check-check') : ''}</div>`;
  let corpo;
  if (m.serv) {
    const s = SERV[m.serv];
    corpo = `<div class="serv-msg"><img src="${s.foto}" alt=""><div><b>${s.nome}</b><small>${s.cat} · ${s.spec}</small><span>${ic('calendar-check', 'ic-sm')}${R.v.acaoItem}</span></div></div>`;
  } else if (m.audio) {
    const r = semente(m.txt.length), ondas = Array.from({ length: 28 }, () => `<i style="height:${4 + Math.round(r() * 18)}px;animation-delay:${(r() * .8).toFixed(2)}s"></i>`).join('');
    corpo = `<div class="audio" data-dur="${m.audio}"><button class="play" aria-label="Tocar áudio">${ic('play')}</button><span class="ondas">${ondas}</span><span class="dur">${m.audio}</span></div><div class="transc"><b>Transcrição:</b> ${m.txt}</div>`;
  } else {
    corpo = (m.fu ? `<div class="tag-fu">${ic('repeat', 'ic-sm')}Follow-up automático</div><br>` : '') + m.txt;
  }
  return `<div class="msg ${out ? 'out' : 'cli'}">${autor}${corpo}${hora}</div>`;
}

function ligaAudios(raiz) {
  raiz.querySelectorAll('.audio .play').forEach(b => b.onclick = () => {
    const a = b.closest('.audio'); if (a.classList.contains('tocando')) return;
    a.classList.add('tocando'); b.innerHTML = ic('pause'); b.setAttribute('aria-label', 'Tocando');
    const seg = a.dataset.dur.split(':').reduce((m, s) => m * 60 + +s, 0);
    setTimeout(() => { a.classList.remove('tocando'); b.innerHTML = ic('play'); b.setAttribute('aria-label', 'Tocar áudio'); }, Math.min(seg, 6) * 1000);
  });
}

function abreConversa(id) {
  selecionada = id;
  const l = LEADS.find(x => x.id === id); if (!l) return;
  l.naoLidas = 0; l.nova = false;
  renderLista();
  const ia = comIA(l), podeDigitar = l.status === 'eq';
  const quem = l.resp ? EQUIPE[l.resp].nome : '';
  $('#chat').innerHTML = `
    <div class="chat-topo">
      <button class="icone-btn btn-voltar-chat" aria-label="Voltar pra lista">${ic('chevron-left')}</button>
      ${avContato(l)}
      <div><b>${l.nome}</b><small>${l.tel} · ${l.origem}</small></div>
      <div class="acoes">${ia ? `<button class="btn" id="assumir" aria-label="Assumir conversa">${ic('hand', 'ic-sm')}<span>Assumir conversa</span></button>` : l.status === 'eq' ? `<button class="btn btn-leve" id="devolver" aria-label="Devolver pra assistente">${ic('bot', 'ic-sm')}<span>Devolver pra assistente</span></button>` : ''}
        <button class="icone-btn" id="ver-estr" aria-label="Estratégia">${ic('sparkles')}</button>
        <button class="icone-btn" id="ver-ficha" aria-label="Ficha do contato">${ic('notebook-pen')}</button></div>
    </div>
    <div class="mensagens" id="mensagens">${l.msgs.map(htmlMsg).join('')}</div>
    ${ia ? `<div class="aviso-ia"><img src="${MASCOTE}" width="20" height="20" alt=""><span>A assistente está conduzindo esta conversa.</span><button id="assumir2">Assumir</button></div>` : ''}
    <div class="chat-base"><label class="so-leitor" for="campo">Mensagem</label><input class="campo" id="campo" autocomplete="off" placeholder="${podeDigitar ? (l.resp === R.logado ? 'Escreva uma mensagem' : 'Escreva como ' + quem) : l.status === 'fim' ? 'Conversa encerrada' : 'Assuma a conversa pra escrever'}" ${podeDigitar ? '' : 'disabled'}><button class="icone-btn" id="enviar" aria-label="Enviar" ${podeDigitar ? '' : 'disabled'}>${ic('send')}</button></div>`;
  if (innerWidth <= 980) document.body.classList.add('chat-cheio');
  const box = $('#mensagens'); box.scrollTop = box.scrollHeight;
  ligaAudios(box);
  const assumir = () => {
    l.status = 'eq'; l.resp = R.logado; l.assumida = true; l.ordem = Math.max(...LEADS.map(x => x.ordem)) + 1; l.quando = agoraHora();
    l.msgs.push({ de: 'sis', ic: 'hand', txt: EQUIPE[R.logado].nome + ' assumiu a conversa. A assistente parou de responder aqui.' });
    abreConversa(id); $('#campo').focus();
  };
  if ($('#assumir')) $('#assumir').onclick = assumir;
  if ($('#assumir2')) $('#assumir2').onclick = assumir;
  if ($('#devolver')) $('#devolver').onclick = () => { l.status = 'ia'; l.resp = null; l.msgs.push({ de: 'sis', ic: 'bot', txt: 'Conversa devolvida para a assistente.' }); abreConversa(id); };
  const enviar = () => {
    const c = $('#campo'); if (!c.value.trim() || c.disabled) return;
    l.msgs.push({ de: 'eq', quem: l.resp, h: agoraHora(), txt: esc(c.value.trim()) });
    l.quando = agoraHora(); l.dispensada = false;
    abreConversa(id);
  };
  $('#enviar').onclick = enviar;
  $('#campo').onkeydown = e => { if (e.key === 'Enter') enviar(); };
  $('#ver-estr').onclick = () => abrePainel('estr');
  $('#ver-ficha').onclick = () => abrePainel('ficha');
  $('.btn-voltar-chat').onclick = () => { document.body.classList.remove('chat-cheio'); selecionada = null; renderLista(); };
  renderFicha(l);
}

/* ---------- Estratégia e ficha (painel ao lado da conversa) ---------- */
function estrPadrao(l) {
  if (l.status === 'ia') return { analise: 'A assistente está conduzindo. Ela passa a conversa pra equipe quando o contato pede valor ou desconto, reclama ou pede pra falar com uma pessoa. Nada pra fazer agora.' };
  if (l.status === 'ag') return { analise: `O contato parou de responder. ${l.proximo}. Se ela voltar a escrever, a assistente continua de onde parou.` };
  if (l.status === 'fim') return { analise: l.etapa ? `Negócio fechado. Próximo passo: ${l.proximo.toLowerCase()}.` : 'O contato disse não. A conversa foi encerrada e nenhum follow-up será enviado.' };
  return { analise: `Está com ${EQUIPE[l.resp].nome}. Próximo passo: ${l.proximo.charAt(0).toLowerCase() + l.proximo.slice(1)}.` };
}
function setAba(a) {
  aba = a;
  $('#aba-estr').setAttribute('aria-selected', a === 'estr');
  $('#aba-ficha').setAttribute('aria-selected', a === 'ficha');
  $('#ficha-corpo').setAttribute('aria-labelledby', a === 'estr' ? 'aba-estr' : 'aba-ficha');
  const l = LEADS.find(x => x.id === selecionada);
  if (l) renderFicha(l);
}
function abrePainel(a) {
  setAba(a);
  if (innerWidth <= 1280) { $('#ficha').classList.add('aberta'); $('#fecha-ficha').focus(); }
}
function fechaPainel() {
  if (!$('#ficha').classList.contains('aberta')) return false;
  $('#ficha').classList.remove('aberta');
  const volta = $('#ver-' + aba); if (volta) volta.focus();
  return true;
}
function renderFicha(l) {
  const corpo = $('#ficha-corpo');
  const cab = `<div class="ficha-cab">${avContato(l)}<div><b>${l.nome}</b><small>${l.tel}</small></div></div>`;
  if (aba === 'estr') {
    const e = l.estr || estrPadrao(l), sit = situacao(l), pode = l.status === 'eq';
    corpo.innerHTML = `<div class="estr-nota"><img src="${MASCOTE}" width="24" height="24" alt=""><span>A assistente lê a conversa e sugere o próximo passo. Quem envia é sempre alguém da equipe.</span></div>
      <p class="estr-analise">${e.analise}</p>
      ${e.msg ? `<div class="estr-msg"><small>Sugestão de resposta</small><p>${e.msg}</p><button class="btn" id="usar-sug" ${pode ? '' : 'disabled'}>${ic('arrow-right', 'ic-sm')}Usar no campo</button>${pode ? '' : '<small style="margin:8px 0 0;font-weight:500">Assuma a conversa pra usar a sugestão.</small>'}</div>` : ''}
      ${sit === 'responder' ? `<button class="btn btn-leve" id="dispensar-f" style="margin-top:14px">${ic('check', 'ic-sm')}Não precisa responder</button>` : ''}`;
    if ($('#usar-sug')) $('#usar-sug').onclick = () => { const c = $('#campo'); c.value = e.msg; fechaPainel(); c.focus(); };
    if ($('#dispensar-f')) $('#dispensar-f').onclick = () => dispensa(l.id);
    return;
  }
  corpo.innerHTML = cab + `
    <h3>Resumo da assistente</h3>
    <div class="resumo-ia"><div class="t"><img src="img/cabeca-frente-16.png" width="16" height="16" alt="">Escrito pela assistente</div>${l.resumo}</div>
    <h3>Andamento</h3>
    <div class="edita"><label for="f-etapa">Etapa</label><select id="f-etapa">${l.etapa ? '' : '<option value="" selected>Encerrado</option>'}${ETAPAS.map(e => `<option value="${e.id}" ${e.id === l.etapa ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></div>
    <div class="edita"><label for="f-prox">Próximo passo</label><input id="f-prox" value="${esc(l.proximo)}"></div>
    <div class="dado"><span>Responsável</span><b>${l.resp ? EQUIPE[l.resp].nome : 'Assistente'}</b></div>
    <div class="dado"><span>Origem</span><b>${l.origem}</b></div>
    <h3>O que procura</h3>
    <div class="dado"><span>Perfil</span><b>${l.neg}</b></div>
    <div class="dado"><span>Interesse</span><b>${l.interesse}</b></div>
    ${l.serv ? `<div class="dado"><span>${R.v.itemRot}</span><b>${SERV[l.serv].nome}</b></div>` : ''}
    ${l.valor ? `<div class="dado"><span>Valor</span><b>${valorCurto(l)}</b></div>` : ''}`;
  $('#f-etapa').onchange = ev => {
    if (!ev.target.value) return;
    l.etapa = ev.target.value; l.chegou = true;
    const et = ETAPAS.find(x => x.id === l.etapa);
    if (renderizado.funil) renderKanban();
    avisa(`${l.nome} foi para ${et.nome}`, 'O funil e o painel já foram atualizados.', 'kanban');
  };
  $('#f-prox').onchange = ev => {
    const v = ev.target.value.trim(); if (!v) { ev.target.value = l.proximo; return; }
    l.proximo = esc(v); avisa('Próximo passo salvo', v, 'check');
  };
}

function marcaFiltro() { $('#filtros').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === filtro)); }
function renderConversas() {
  renderLista();
  $('#filtros').querySelectorAll('button').forEach(b => b.onclick = () => { filtro = b.dataset.f; marcaFiltro(); renderLista(); });
  if (!selecionada) $('#ficha-corpo').innerHTML = '<p class="estr-livre">Escolha uma conversa pra ver a estratégia e a ficha.</p>';
}
document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => setAba(b.dataset.aba));
$('#fecha-ficha').onclick = fechaPainel;
addEventListener('keydown', e => { if (e.key === 'Escape') fechaPainel(); });
addEventListener('resize', () => { if (innerWidth > 980) document.body.classList.remove('chat-cheio'); });
$('#busca').addEventListener('input', e => {
  busca = e.target.value.trim();
  if (busca && filtro !== 'todas') { filtro = 'todas'; marcaFiltro(); }
  if (location.hash !== '#conversas') location.hash = 'conversas';
  else renderLista();
});

/* ---------- Funil ---------- */
function renderKanban() {
  const ativos = LEADS.filter(l => l.etapa);
  const pot = ativos.filter(l => l.etapa !== ETAPA_FIM).reduce((s, l) => s + l.valor, 0);
  $('#funil-total').innerHTML = `<b>${ativos.length}</b> contatos no funil · ${R.v.funilTotal}: <b>${brl(pot)}</b>`;
  $('#kanban').innerHTML = ETAPAS.map(e => {
    const cs = ativos.filter(l => l.etapa === e.id).sort(porOrdem);
    return `<div class="coluna" data-e="${e.id}" style="--cor:${e.cor}"><div class="col-cab"><i style="background:${e.cor}"></i><h2 style="font-size:inherit">${e.nome}</h2><span class="n">${cs.length}</span></div>${cs.map(l => `
      <div class="lead-card ${l.chegou ? 'chegou' : ''}" draggable="true" tabindex="0" role="button" aria-label="${l.nome}, ${l.interesse}. Abrir conversa" data-id="${l.id}"><b>${l.nome}</b><div class="int">${l.interesse}</div>
      <div class="pe">${l.valor ? `<span class="valor">${valorCurto(l)}</span>` : `<span class="chip">${ic(R.chipSem(l)[0])}${R.chipSem(l)[1]}</span>`}<span class="chip">${l.origem}</span>
      ${l.resp ? avEquipe(l.resp) : avIA()}</div></div>`).join('')}</div>`;
  }).join('');
  ativos.forEach(l => l.chegou = false);
  let arrastado = null;
  const abre = id => { location.hash = 'conversas'; setTimeout(() => abreConversa(id), 0); };
  $('#kanban').querySelectorAll('.lead-card').forEach(c => {
    c.ondragstart = () => { arrastado = c.dataset.id; c.classList.add('arrastando'); };
    c.ondragend = () => c.classList.remove('arrastando');
    c.onclick = () => abre(c.dataset.id);
    c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abre(c.dataset.id); } };
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
      if (selecionada === l.id) renderFicha(l);
      avisa(`${l.nome} foi para ${et.nome}`, 'O painel e os relatórios já foram atualizados.', 'kanban');
      if (l.etapa === ETAPA_FIM) addFeed(['star', 'ok', `Negócio fechado com <b>${l.nome}</b>`, 'agora']);
    };
  });
}

/* ---------- Follow-ups ---------- */
const FOLLOWUPS = R.followups;
function renderFollowups() {
  const k = [['repeat', 'Agendados', FOLLOWUPS.filter(f => f.st === 'ag').length, 'próximos 7 dias', 'fu'], ['send', 'Enviados no mês', R.fuKpi[0], 'só em horário comercial', 'conv'], ['message-circle', 'Responderam', R.fuKpi[1], R.fuKpi[2], 'serv'], ['calendar-check', R.v.fuKpiRot, R.fuKpi[3], 'contatos que tinham sumido', 'painel']];
  $('#fu-kpis').innerHTML = k.map(([i, r, n, v, c]) => `<div class="card kpi"><div class="rot">${tile(i, c)}${r}</div><div class="num">${n}</div><div class="var">${v}</div></div>`).join('');
  const chip = { ag: `<span class="chip chip-fu">${ic('clock-3')}Agendado</span>`, ok: `<span class="chip chip-ia">${ic('check')}Respondeu</span>`, bad: `<span class="chip chip-bad">${ic('ban')}Cancelado</span>` };
  $('#fu-lista').innerHTML = FOLLOWUPS.map(f => `<div class="fu-item"><div class="quando"><b>${f.quando}</b><small>${f.h}</small></div><div class="q"><b>${f.lead}</b> · ${f.toque}<small>${f.motivo}</small><div class="prev">${f.msg}</div></div><div>${chip[f.st]}</div></div>`).join('');
}

/* ---------- Serviços ---------- */
function renderServicos() {
  $('#serv-grade').innerHTML = Object.values(SERV).map(s => `
    <div class="card serv-card"><div class="foto"><img src="${s.foto}" alt="${s.nome}" loading="lazy"><span class="chip chip-ia">${ic('check')}Ativo</span></div>
    <div class="info"><b>${s.nome}</b><div class="preco">${precoTxt(s)}</div>
    <div class="specs"><span>${ic('clock-3', 'ic-sm')}${s.spec}</span><span>${s.cat}</span></div>
    <div class="specs" style="margin-top:6px"><span>${ic('tag', 'ic-sm')}${s.extra}</span></div>
    <div class="uso"><div><b>${s.procuras}</b><small>${R.v.usoA}</small></div><div><b>${s.agendados}</b><small>${R.v.usoB}</small></div></div>
    <button class="btn btn-leve editar-serv" style="margin-top:10px;width:100%;justify-content:center">${ic('sliders-horizontal', 'ic-sm')}${R.v.editarItem}</button></div></div>`).join('');
  document.querySelectorAll('.editar-serv').forEach(b => b.onclick = () => avisa(R.v.editarItem, 'Na versão de vocês, aqui muda valor, detalhes e o que a assistente fala sobre ele.', 'sliders-horizontal'));
}

/* ---------- Equipe ---------- */
function renderRodizio() {
  const ordem = rodizio.filter(r => !foraRodizio.has(r)).concat(rodizio.filter(r => foraRodizio.has(r)));
  const vez = ordem.find(r => !foraRodizio.has(r));
  $('#rodizio').innerHTML = ordem.map((r, i) => { const p = EQUIPE[r]; return `<div class="rod ${r === vez ? 'vez' : ''}"><span class="pos">${i + 1}</span>${avEquipe(r)}<div><b>${p.nome}</b><small>${foraRodizio.has(r) ? 'Fora do rodízio' : r === vez ? 'Recebe o próximo contato' : 'Na fila'}</small></div><div class="dir">${r === vez ? '<span class="chip chip-ia">Da vez</span>' : ''}<button class="chave" role="switch" aria-checked="${!foraRodizio.has(r)}" data-r="${r}" aria-label="${p.nome} no rodízio"></button></div></div>`; }).join('')
    + R.extraRod.map(([k, i, t]) => `<div class="rod"><span class="pos">${ic(i, 'ic-sm')}</span>${avEquipe(k)}<div><b>${EQUIPE[k].nome}</b><small>${t}</small></div></div>`).join('');
  $('#rodizio').querySelectorAll('.chave').forEach(c => c.onclick = () => {
    const r = c.dataset.r;
    if (foraRodizio.has(r)) foraRodizio.delete(r); else { if (rodizio.filter(x => !foraRodizio.has(x)).length === 1) return avisa('Precisa de alguém no rodízio', 'Pelo menos uma pessoa tem que ficar disponível.', 'info'); foraRodizio.add(r); }
    renderRodizio();
    $(`#rodizio .chave[data-r="${r}"]`).focus();
  });
}
function renderEquipe() {
  renderRodizio();
  const linhas = R.tabEq;
  const max = Math.max(...linhas.map(x => x[1]));
  $('#tab-eq').innerHTML = `<tr>${R.v.tabHead.map(h => `<th>${h}</th>`).join('')}</tr>` + linhas.map(([r, le, vi, pr, fe, t]) => { const p = EQUIPE[r]; return `<tr><td class="nome">${avEquipe(r)}<div>${p.nome}<small>${p.papel}</small></div></td><td><div style="display:flex;align-items:center;gap:8px"><b>${le}</b><span class="mini-trilho"><i style="width:${le / max * 100}%"></i></span></div></td><td>${vi}</td><td>${pr || '-'}</td><td>${fe || '-'}</td><td>${t}</td></tr>`; }).join('');
}

/* ---------- Regras da assistente ---------- */
const caixaHtml = (t, on) => `<label class="check"><input type="checkbox" ${on ? 'checked' : ''}><span class="caixa">${ic('check')}</span><span class="txt">${t}</span></label>`;
function checks(alvo, itens, dica, rotulo) {
  const id = alvo.slice(1) + '-campo';
  $(alvo).innerHTML = itens.map(([t, on]) => caixaHtml(t, on)).join('')
    + `<form class="nova-regra"><label for="${id}">${ic('plus')}${rotulo}</label><div class="linha"><input id="${id}" placeholder="${dica}"><button class="btn" type="submit">${ic('plus', 'ic-sm')}Adicionar</button></div></form>`;
  const f = $(alvo).querySelector('.nova-regra'), campo = f.querySelector('input');
  f.onsubmit = e => {
    e.preventDefault();
    const v = campo.value.trim(); if (!v) return campo.focus();
    f.insertAdjacentHTML('beforebegin', caixaHtml(esc(v), true));
    f.previousElementSibling.insertAdjacentHTML('beforeend', '<span class="tag-nova">Nova</span>');
    f.reset();
    avisa('Regra adicionada', 'A assistente já segue essa regra nas próximas conversas.', 'check');
  };
}
function renderAssistente() {
  checks('#ch-passar', R.passar, R.passarDica, 'Escreva outra situação pra passar pra equipe');
  checks('#ch-nunca', R.nunca, R.nuncaDica, 'Escreva outra coisa que ela nunca deve fazer');
  checks('#ch-quali', R.quali, R.qualiDica, 'Escreva outra pergunta pra ela fazer');
  $('#salvar-regras').onclick = () => avisa('Regras salvas', 'A assistente segue o que vocês escreveram a partir da próxima mensagem.', 'check');
  const base = R.base;
  const cores = ['serv', 'fu', 'funil', 'conv', 'eq', 'painel'];
  $('#base').innerHTML = base.map(([i, t, s], n) => `<div><b>${tile(i, cores[n % cores.length])}${t}</b><small>${s}</small></div>`).join('');
  document.querySelectorAll('#v-assistente .chave').forEach(c => c.onclick = () => c.setAttribute('aria-checked', c.getAttribute('aria-checked') !== 'true'));
  document.querySelectorAll('#v-assistente .seg button').forEach(b => b.onclick = () => b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)));
}

const RENDER = {
  painel: () => { renderKpis(); renderDias(); renderFunil(); renderOrigem(); renderCalor(); renderFeed(); renderAgenda(); renderTopServ(); },
  conversas: renderConversas, funil: renderKanban, followups: renderFollowups, servicos: renderServicos, equipe: renderEquipe, assistente: renderAssistente,
};

/* ---------- Simulação de um contato novo ---------- */
async function simular() {
  if (simRodando) return;
  simRodando = true; $('#btn-simular').disabled = true;
  const base = SIMULACOES[simIndice % SIMULACOES.length];
  const volta = Math.floor(simIndice / SIMULACOES.length);
  simIndice++;
  const corretor = rodizio.find(r => !foraRodizio.has(r)) || R.rodizio[0];
  const nomeC = EQUIPE[corretor].nome;
  const sub = t => t && t.replaceAll('{corretor}', nomeC);
  const l = { ...base, id: base.id + volta, resumo: sub(base.resumo), proximo: sub(base.proximo), estr: { analise: sub(base.estr.analise), msg: sub(base.estr.msg) },
    etapa: ETAPA_NOVO, status: 'ia', resp: null, quando: agoraHora(), ordem: Math.max(...LEADS.map(x => x.ordem)) + 1, nova: true, naoLidas: 0, msgs: [{ dia: 'Hoje' }] };
  delete l.roteiro;
  LEADS.unshift(l);
  avisa(`Novo contato: ${l.nome}`, `Chegou pelo ${l.origem}. A assistente já está respondendo.`, 'message-circle');
  addFeed(['message-circle', 'ia', `Novo contato: <b>${l.nome}</b>, pelo ${l.origem}`, 'agora']);
  busca = ''; $('#busca').value = ''; filtro = 'aberto';
  if (location.hash !== '#conversas') location.hash = 'conversas';
  marcaFiltro();
  await espera(120);
  abreConversa(l.id);
  let t0 = Date.now();
  for (const passo of base.roteiro) {
    if (l.assumida) break;
    const aberta = () => selecionada === l.id && $('#mensagens');
    if (passo.de === 'cli' || passo.de === 'ia') {
      if (aberta()) { $('#mensagens').insertAdjacentHTML('beforeend', `<div class="digitando ${passo.de === 'cli' ? 'cli' : ''}" id="dig"><i></i><i></i><i></i></div>`); $('#mensagens').scrollTop = 1e6; }
      await espera(passo.serv ? 700 : passo.de === 'cli' ? 1500 : 1300);
      const d = $('#dig'); if (d) d.remove();
      if (l.assumida) break;
    } else await espera(600);
    const m = { ...passo, h: agoraHora() };
    if (m.txt) m.txt = sub(m.txt);
    l.msgs.push(m); l.quando = agoraHora();
    if (passo.de === 'cli') { l.dispensada = false; if (!aberta()) l.naoLidas++; }
    if (passo.de === 'sis') {
      l.status = 'eq'; l.resp = corretor; l.etapa = ETAPA_CONVERSA;
      if (aberta()) abreConversa(l.id);
    } else if (aberta()) { $('#mensagens').insertAdjacentHTML('beforeend', htmlMsg(m)); ligaAudios($('#mensagens')); $('#mensagens').scrollTop = 1e6; }
    if (passo.de === 'ia' && !passo.serv && t0) { $('#ult-resp').textContent = Math.max(2, Math.round((Date.now() - t0) / 1000)) + ' s'; t0 = 0; }
    if (passo.de === 'cli') t0 = Date.now();
    if (l.msgs.length === 5 && l.etapa === ETAPA_NOVO) l.etapa = ETAPA_CONVERSA;
    renderLista();
  }
  if (l.status === 'eq' && l.resp === corretor) {
    l.chegou = true;
    rodizio = rodizio.filter(r => r !== corretor).concat(corretor);
    if (renderizado.equipe) renderRodizio();
    addFeed(['user-check', 'eq', `<b>${l.nome}</b> passada para ${nomeC}, com o resumo`, 'agora']);
    avisa(`${l.nome} passada para ${nomeC}`, `${base.motivo}. A sugestão de resposta está na aba Estratégia.`, 'user-check');
    if (selecionada === l.id) { aba = 'estr'; setAba('estr'); }
  }
  if (renderizado.funil) renderKanban();
  simRodando = false; $('#btn-simular').disabled = false;
}
$('#btn-simular').onclick = simular;
$('#btn-sino').onclick = () => avisa('Avisos no celular', 'Quem for da vez recebe no WhatsApp o próximo contato, com o resumo.', 'bell');

/* Lateral retrátil: lembra a escolha neste navegador */
function lateralCurta(curta) {
  document.body.classList.toggle('lateral-curta', curta);
  const b = $('#recolher'); b.setAttribute('aria-expanded', !curta); b.setAttribute('aria-label', curta ? 'Abrir menu' : 'Recolher menu');
  b.querySelector('.rot').textContent = curta ? 'Abrir menu' : 'Recolher menu';
}
try { lateralCurta(localStorage.getItem('im-lateral') === 'curta'); } catch (e) { lateralCurta(false); }
$('#recolher').onclick = () => {
  const curta = !document.body.classList.contains('lateral-curta');
  lateralCurta(curta);
  try { localStorage.setItem('im-lateral', curta ? 'curta' : 'larga'); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
};
$('#rd-data').textContent = 'Hoje, ' + new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

/* ---------- Ramo: textos que mudam e alternador ---------- */
document.querySelectorAll('[data-r]').forEach(e => { const t = R.v[e.dataset.r]; if (t != null) e.textContent = t; });
document.querySelectorAll('[data-rt]').forEach(e => { const t = R.v[e.dataset.rt]; if (t != null) e.title = t; });
$('#conta-nome').textContent = R.empresa; $('#conta-sub').textContent = R.central;
{
  const eu = EQUIPE[R.logado];
  $('#eu-av').textContent = eu.sigla; $('#eu-av').style.background = eu.cor;
  $('#eu-nome').textContent = eu.nome; $('#eu-sub').textContent = R.empresa;
}
$('#busca').placeholder = R.v.busca;
$('#leg-hor').textContent = R.horario;
$('#ver-itens').textContent = 'Ver ' + R.v.itensNav.toLowerCase();
$('#regras-txt').value = R.livre;
document.title = 'Inbox Mestre | Demonstração (' + R.empresa + ')';

/* Alternador: a faixa chama atenção ao abrir e se acalma depois da primeira escolha (nesta aba). */
(function () {
  const faixa = $('#ramos'), lista = $('#ramos-lista');
  let visto = false;
  try { visto = sessionStorage.getItem('im-ramo-visto') === '1'; } catch (e) { /* sem armazenamento: chama atenção de novo */ }
  if (visto) faixa.classList.remove('chamar');
  lista.innerHTML = window.RAMOS_LISTA.map(([id, nome, icone, cor]) =>
    `<button type="button" class="ramo" data-ramo="${id}" style="--cor:${cor}" aria-pressed="${id === R.id}"><span class="ri">${ic(icone)}</span>${nome}</button>`).join('');
  lista.querySelectorAll('.ramo').forEach(b => b.onclick = () => {
    faixa.classList.remove('chamar');
    try { sessionStorage.setItem('im-ramo-visto', '1'); } catch (e) { /* tudo bem */ }
    if (b.dataset.ramo === R.id) return;
    const u = new URL(location.href);
    u.searchParams.set('ramo', b.dataset.ramo);
    u.searchParams.delete('simular');
    u.hash = '#painel';
    location.href = u.toString();
  });
  const ativo = lista.querySelector('[aria-pressed="true"]');
  if (ativo && ativo.scrollIntoView) ativo.scrollIntoView({ block: 'nearest', inline: 'nearest' });
})();

/* Início */
atualizaContador();
vai();
if (new URLSearchParams(location.search).has('simular')) setTimeout(simular, 900);
