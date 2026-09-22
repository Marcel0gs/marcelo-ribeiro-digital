/* ==========================================================================
   Home - Marcelo Ribeiro
   1. Abertura: frases que viram poeira, e a poeira de uma monta a
      seguinte (porte do VaporizeTextCycle do
      21st.dev pra canvas puro, sem React). Mesma física do original: uma
      onda passa da esquerda pra direita, cada pixel que ela alcança ganha
      velocidade aleatória com amortecimento e vai apagando.
      Diferença de propósito: o original desenha um fillRect por partícula;
      aqui tudo vai num único ImageData por quadro, que é o que deixa rodar
      liso no celular. E aceita quebra de linha, que o original não aceita.
   2. Entradas: títulos palavra por palavra, blocos subindo, contato em
      cascata com a foto abrindo na diagonal.
   3. Vídeo do astronauta, luz no hero, ícones sorteados da seção 2,
      caminho do cliente animado, rastro roxo do cursor, topo.
   ========================================================================== */
(function () {
  "use strict";

  var html = document.documentElement;
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- *
   * ENTRADAS
   * ---------------------------------------------------------------- */

  // Quebra o título em palavras mascaradas. <em> vira palavras também,
  // mantendo o itálico colorido em volta delas.
  var contador;
  function quebrar(no) {
    Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
      if (filho.nodeType === 3) {
        var partes = filho.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        partes.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
          var fora = document.createElement("span");
          fora.className = "palavra";
          var dentro = document.createElement("span");
          dentro.textContent = p;
          dentro.style.setProperty("--i", contador++);
          fora.appendChild(dentro);
          frag.appendChild(fora);
        });
        no.replaceChild(frag, filho);
      } else if (filho.nodeType === 1) {
        quebrar(filho);
      }
    });
  }
  document.querySelectorAll("[data-palavras]").forEach(function (t) {
    t.setAttribute("aria-label", t.textContent.replace(/\s+/g, " ").trim());
    contador = 0;
    quebrar(t);
    t.querySelectorAll(".palavra").forEach(function (p) { p.setAttribute("aria-hidden", "true"); });
  });

  var alvos = document.querySelectorAll("[data-revela], [data-palavras]:not(.hero__titulo)");
  if ("IntersectionObserver" in window && !reduzido) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visivel"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    alvos.forEach(function (a) { io.observe(a); });
  } else {
    alvos.forEach(function (a) { a.classList.add("is-visivel"); });
  }

  // Contato: a diagonal só abre com a foto já decodificada. Antes, a foto
  // era lazy e a animação rodava sobre o vazio, com a imagem surgindo depois.
  var contato = document.querySelector("[data-contato]");
  if (contato) {
    var foto = contato.querySelector(".contato__foto img");
    var fotoPronta = !foto ? Promise.resolve() :
      (foto.decode ? foto.decode() : new Promise(function (ok) { foto.complete ? ok() : foto.addEventListener("load", ok, { once: true }); }))
        .catch(function () {});   // se a foto falhar, a seção entra mesmo assim
    var mostrarContato = function () { fotoPronta.then(function () { contato.classList.add("is-visivel"); }); };
    if ("IntersectionObserver" in window && !reduzido) {
      var ioContato = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { mostrarContato(); ioContato.disconnect(); }
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
      ioContato.observe(contato);
    } else {
      contato.classList.add("is-visivel");
    }
  }

  /* ---------------------------------------------------------------- *
   * HERO: vídeo e entrada depois da abertura
   * ---------------------------------------------------------------- */
  var heroVideo = document.querySelector("[data-hero-video]");
  function tocarVideo() {
    if (!heroVideo || reduzido) return;
    heroVideo.addEventListener("playing", function () { heroVideo.classList.add("is-tocando"); }, { once: true });
    var p = heroVideo.play();
    if (p && p.catch) p.catch(function () {});
  }

  function entrarSite() {
    html.classList.remove("abertura-ativa");
    html.classList.add("site-pronto");
    var titulo = document.querySelector(".hero__titulo");
    if (titulo) titulo.classList.add("is-visivel");
    tocarVideo();
  }

  /* ---------------------------------------------------------------- *
   * ABERTURA
   * ---------------------------------------------------------------- */
  var FRASES = [
    { texto: "Seu concorrente não é melhor que você.", cor: [239, 238, 233] },
    { texto: "Ele só apareceu primeiro.", cor: [150, 134, 255] }
  ];
  // forma: a poeira da frase anterior voando pra montar a próxima
  var TEMPO = { entra: 800, segura: 1000, vaporiza: 1500, forma: 1700 };

  var abertura = document.querySelector("[data-abertura]");
  if (!html.classList.contains("abertura-ativa") || !abertura) {
    // dois quadros de espera: o navegador precisa pintar o estado inicial
    // (tudo escondido) antes, senão a cascata do hero não tem de onde animar
    requestAnimationFrame(function () { requestAnimationFrame(entrarSite); });
  } else {
    iniciarAbertura();
  }

  function iniciarAbertura() {
    var canvas = abertura.querySelector("[data-abertura-canvas]");
    var barra = abertura.querySelector("[data-abertura-progresso]");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var encerrada = false, quadro = null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var passo = dpr > 1.3 ? 2 : 1;           // amostra a cada N pixels do aparelho
    var W, H, img, buf;
    // só a primeira frase surge do escuro; as outras nascem da poeira da
    // anterior. A última abre a cortina assim que a onda termina de passar.
    var total = TEMPO.entra + TEMPO.segura + TEMPO.vaporiza +
      (FRASES.length - 1) * (TEMPO.forma + TEMPO.segura + TEMPO.vaporiza);
    var inicioGeral = 0;

    try { sessionStorage.setItem("abertura-vista", "1"); } catch (e) {}

    function medir() {
      W = Math.floor(canvas.clientWidth * dpr);
      H = Math.floor(canvas.clientHeight * dpr);
      canvas.width = W; canvas.height = H;
      img = ctx.createImageData(W, H);
      buf = new Uint32Array(img.data.buffer);
    }

    // mesma curva do original: fonte maior espalha mais
    function espalhamentoBase(px) {
      if (px <= 20) return 0.2;
      if (px >= 100) return 1.5;
      if (px <= 50) return 0.2 + (px - 20) * 0.3 / 30;
      return 0.5 + (px - 50) * 1.0 / 50;
    }

    function criarParticulas(frase) {
      var css = W / dpr;
      var tamanho = Math.round(Math.max(34, Math.min(78, css * 0.056)));
      var fonte = "800 " + (tamanho * dpr) + "px Archivo, 'Helvetica Neue', Arial, sans-serif";
      ctx.clearRect(0, 0, W, H);
      ctx.font = fonte;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";

      // quebra em linhas pra caber em 86% da largura
      var max = W * 0.86, palavras = frase.texto.split(" "), linhas = [], atual = "";
      palavras.forEach(function (p) {
        var teste = atual ? atual + " " + p : p;
        if (ctx.measureText(teste).width > max && atual) { linhas.push(atual); atual = p; } else { atual = teste; }
      });
      linhas.push(atual);

      var alt = tamanho * dpr * 1.08, y0 = H / 2 - (linhas.length - 1) * alt / 2;
      var esq = W, dir = 0;
      linhas.forEach(function (l, i) {
        var w = ctx.measureText(l).width;
        esq = Math.min(esq, W / 2 - w / 2); dir = Math.max(dir, W / 2 + w / 2);
        ctx.fillText(l, W / 2, y0 + i * alt);
      });

      var dados = ctx.getImageData(0, 0, W, H).data;
      ctx.clearRect(0, 0, W, H);

      var lista = [];
      for (var y = 0; y < H; y += passo) {
        for (var x = 0; x < W; x += passo) {
          var a = dados[(y * W + x) * 4 + 3];
          if (a > 24) lista.push(x, y, a / 255);
        }
      }
      var n = lista.length / 3;
      var P = {
        n: n, esq: esq, dir: dir, cor: frase.cor,
        x: new Float32Array(n), y: new Float32Array(n), ox: new Float32Array(n), oy: new Float32Array(n),
        vx: new Float32Array(n), vy: new Float32Array(n), a: new Float32Array(n), oa: new Float32Array(n),
        vivo: new Uint8Array(n), rapido: new Uint8Array(n),
        S: espalhamentoBase(tamanho) * 5 * dpr
      };
      for (var i = 0; i < n; i++) {
        P.x[i] = P.ox[i] = lista[i * 3];
        P.y[i] = P.oy[i] = lista[i * 3 + 1];
        P.a[i] = P.oa[i] = lista[i * 3 + 2];
      }
      return P;
    }

    var le = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    function limpar() { buf.fill(0); }
    function mostrar() { ctx.putImageData(img, 0, 0); }
    // pinta um conjunto de partículas no buffer. Com P.e (formação), a cor
    // de cada uma sai da cor da frase anterior e chega na da frase nova.
    function pintar(P, fator) {
      var r = P.cor[0], g = P.cor[1], b = P.cor[2], de = P.deCor, mistura = !!P.e;
      for (var i = 0; i < P.n; i++) {
        var a = P.a[i] * fator;
        if (a <= 0.01) continue;
        var px = P.x[i] | 0, py = P.y[i] | 0;
        if (px < 0 || py < 0 || px >= W - passo || py >= H - passo) continue;
        var rr = r, gg = g, bb = b;
        if (mistura) {
          var e = P.e[i];
          rr = (de[0] + (r - de[0]) * e) | 0; gg = (de[1] + (g - de[1]) * e) | 0; bb = (de[2] + (b - de[2]) * e) | 0;
        }
        var A = (Math.min(1, a) * 255) | 0;
        var cor = le ? ((A << 24) | (bb << 16) | (gg << 8) | rr) >>> 0 : ((rr << 24) | (gg << 16) | (bb << 8) | A) >>> 0;
        var base = py * W + px;
        buf[base] = cor;
        if (passo === 2) { buf[base + 1] = cor; buf[base + W] = cor; buf[base + W + 1] = cor; }
      }
    }
    function desenhar(P, fator) { limpar(); pintar(P, fator); mostrar(); }

    // Liga a frase nova à poeira da anterior: cada partícula nova nasce em
    // cima de um grão ainda vivo e ganha um atraso proporcional à posição
    // final, então a frase se monta da esquerda pra direita, no mesmo
    // sentido em que a outra se desfez.
    function prepararFormacao(N, V) {
      var vivos = [];
      for (var k = 0; k < V.n; k++) if (V.a[k] > 0.03) vivos.push(k);
      N.sx = new Float32Array(N.n); N.sy = new Float32Array(N.n);
      N.atraso = new Float32Array(N.n); N.e = new Float32Array(N.n);
      N.deCor = V.cor;
      var larg = Math.max(1, N.dir - N.esq), S = N.S;
      for (var j = 0; j < N.n; j++) {
        if (vivos.length) {
          var q = vivos[(Math.random() * vivos.length) | 0];
          N.sx[j] = V.x[q] + (Math.random() - 0.5) * S * 4;
          N.sy[j] = V.y[q] + (Math.random() - 0.5) * S * 4;
        } else {
          N.sx[j] = V.esq + Math.random() * (V.dir - V.esq);
          N.sy[j] = H / 2 + (Math.random() - 0.5) * H * 0.3;
        }
        N.x[j] = N.sx[j]; N.y[j] = N.sy[j];
        N.atraso[j] = ((N.ox[j] - N.esq) / larg) * 0.42 + Math.random() * 0.12;
        N.vx[j] = (Math.random() - 0.5) * 2;   // curva do voo, fixa por partícula
        N.a[j] = 0;
      }
    }
    function formar(N, t) {
      var janela = 0.46, fim = true, S = N.S;
      for (var j = 0; j < N.n; j++) {
        var l = (t / TEMPO.forma - N.atraso[j]) / janela;
        if (l < 0) l = 0; else if (l > 1) l = 1;
        if (l < 1) fim = false;
        var e = 1 - Math.pow(1 - l, 3);
        N.x[j] = N.sx[j] + (N.ox[j] - N.sx[j]) * e;
        N.y[j] = N.sy[j] + (N.oy[j] - N.sy[j]) * e + N.vx[j] * Math.sin(e * Math.PI) * S * 9;
        // enquanto espera a vez, é só poeira fraca; chegando, ganha brilho
        N.a[j] = N.oa[j] * (0.22 + 0.78 * e);
        N.e[j] = e;
      }
      return fim;
    }
    function apagarResto(V, dt) {
      for (var k = 0; k < V.n; k++) if (V.a[k] > 0) V.a[k] = Math.max(0, V.a[k] - dt * 1.6);
    }

    // física do original, vetorizada
    function vaporizar(P, ondaX, dt, durMs) {
      var S = P.S, todos = true, dens = 0.78;
      var taxa = 0.25 * (2000 / durMs), vmax = S * 2, esp = S * 3;
      for (var i = 0; i < P.n; i++) {
        if (P.ox[i] > ondaX) { todos = false; continue; }
        if (!P.vivo[i]) {
          var ang = Math.random() * Math.PI * 2, vel = (Math.random() + 0.5) * S;
          P.vx[i] = Math.cos(ang) * vel; P.vy[i] = Math.sin(ang) * vel;
          P.rapido[i] = Math.random() > dens ? 1 : 0;
          P.vivo[i] = 1;
        }
        if (P.rapido[i]) {
          P.a[i] = Math.max(0, P.a[i] - dt);
        } else {
          var dx = P.ox[i] - P.x[i], dy = P.oy[i] - P.y[i];
          var dist = Math.sqrt(dx * dx + dy * dy);
          var amort = Math.max(0.95, 1 - dist / (100 * S));
          P.vx[i] = (P.vx[i] + (Math.random() - 0.5) * esp + dx * 0.002) * amort;
          P.vy[i] = (P.vy[i] + (Math.random() - 0.5) * esp + dy * 0.002) * amort;
          var v = Math.sqrt(P.vx[i] * P.vx[i] + P.vy[i] * P.vy[i]);
          if (v > vmax) { P.vx[i] *= vmax / v; P.vy[i] *= vmax / v; }
          P.x[i] += P.vx[i] * dt * 20;
          P.y[i] += P.vy[i] * dt * 10;
          P.a[i] = Math.max(0, P.a[i] - dt * taxa);
        }
        if (P.a[i] > 0.01) todos = false;
      }
      return todos;
    }

    function rodar() {
      medir();
      var indice = 0, fase = "entra", t0 = performance.now(), ultimo = t0;
      var P = criarParticulas(FRASES[0]), resto = null;
      inicioGeral = t0;

      function loop(agora) {
        if (encerrada) return;
        var dt = Math.min((agora - ultimo) / 1000, 0.05);
        ultimo = agora;
        var t = agora - t0;
        if (barra) barra.style.transform = "scaleX(" + Math.min(1, (agora - inicioGeral) / total) + ")";

        if (fase === "entra") {
          desenhar(P, Math.min(1, t / TEMPO.entra));
          if (t >= TEMPO.entra) { fase = "segura"; t0 = agora; }
        } else if (fase === "forma") {
          // a poeira velha continua flutuando e apagando por baixo
          vaporizar(resto, Infinity, dt, TEMPO.vaporiza);
          apagarResto(resto, dt);
          var montou = formar(P, t);
          limpar(); pintar(resto, 1); pintar(P, 1); mostrar();
          if (montou && t >= TEMPO.forma) {
            P.e = null; P.a.set(P.oa); resto = null;
            fase = "segura"; t0 = agora;
          }
        } else if (fase === "segura") {
          desenhar(P, 1);
          if (t >= TEMPO.segura) { fase = "vaporiza"; t0 = agora; }
        } else {
          var prog = Math.min(1, t / TEMPO.vaporiza);
          var onda = P.esq + (P.dir - P.esq) * prog;
          vaporizar(P, onda, dt, TEMPO.vaporiza);
          desenhar(P, 1);
          if (prog >= 1) {
            indice++;
            if (indice >= FRASES.length) { sair(); return; }
            resto = P;
            P = criarParticulas(FRASES[indice]);
            prepararFormacao(P, resto);
            fase = "forma"; t0 = agora;
          }
        }
        quadro = requestAnimationFrame(loop);
      }
      quadro = requestAnimationFrame(loop);
    }

    function sair() {
      if (encerrada) return;
      encerrada = true;
      if (quadro) cancelAnimationFrame(quadro);
      abertura.classList.add("is-saindo");
      setTimeout(function () {
        abertura.classList.add("is-abrindo");
        entrarSite();
      }, 520);
      setTimeout(function () { abertura.remove(); }, 1800);
    }

    abertura.querySelector("[data-abertura-pular]").addEventListener("click", sair);
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { document.removeEventListener("keydown", esc); sair(); }
    });

    // espera a Archivo carregar (o canvas não troca de fonte sozinho depois),
    // mas não segura a abertura por mais de 1,5 s por causa disso
    var pronto = false;
    function comecar() { if (!pronto) { pronto = true; rodar(); } }
    if (document.fonts && document.fonts.load) {
      document.fonts.load("800 64px Archivo").then(comecar, comecar);
      setTimeout(comecar, 1500);
    } else {
      comecar();
    }
  }

  /* ---------------------------------------------------------------- *
   * TOPO sólido ao rolar
   * ---------------------------------------------------------------- */
  var topo = document.querySelector("[data-topo]");
  function ajustarTopo() { if (topo) topo.classList.toggle("is-solido", window.scrollY > 40); }
  window.addEventListener("scroll", ajustarTopo, { passive: true });
  ajustarTopo();

  var ponteiroFino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- *
   * HERO COBERTO PELO SCROLL
   * A altura do hero fica em cache (só relê no resize): por frame, só
   * window.scrollY, que não força recálculo de layout.
   * ---------------------------------------------------------------- */
  var heroCobre = document.querySelector(".hero");
  if (heroCobre) {
    var alturaHero = 0, inicioCobre = 0, pedido = false, cobertoAntes = false;
    var medirHero = function () {
      alturaHero = heroCobre.offsetHeight;
      // hero mais alto que a tela: trava só depois de mostrar o fim dele
      var topo = Math.min(0, window.innerHeight - alturaHero);
      heroCobre.style.setProperty("--hero-topo", topo + "px");
      inicioCobre = Math.max(0, alturaHero - window.innerHeight);
      atualizarCobre();
    };
    var atualizarCobre = function () {
      pedido = false;
      var p = (window.scrollY - inicioCobre) / window.innerHeight;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      heroCobre.style.setProperty("--cobre", reduzido ? 0 : p.toFixed(3));
      // totalmente coberto: pausa o vídeo, que ninguém está vendo
      var coberto = p >= 1;
      if (heroVideo && coberto !== cobertoAntes && html.classList.contains("site-pronto")) {
        if (coberto) heroVideo.pause(); else if (!reduzido) { var pv = heroVideo.play(); if (pv && pv.catch) pv.catch(function () {}); }
      }
      cobertoAntes = coberto;
    };
    window.addEventListener("scroll", function () {
      if (!pedido) { pedido = true; requestAnimationFrame(atualizarCobre); }
    }, { passive: true });
    window.addEventListener("resize", medirHero);
    medirHero();
  }

  /* ---------------------------------------------------------------- *
   * HERO: quadrados acesos e luz roxa em volta do cursor
   * ---------------------------------------------------------------- */
  var hero = document.querySelector(".hero");
  if (hero && ponteiroFino && !reduzido) {
    hero.addEventListener("pointermove", function (ev) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--x", (ev.clientX - r.left).toFixed(0) + "px");
      hero.style.setProperty("--y", (ev.clientY - r.top).toFixed(0) + "px");
      hero.classList.add("is-mouse");
    });
    hero.addEventListener("pointerleave", function () { hero.classList.remove("is-mouse"); });
  }

  /* ---------------------------------------------------------------- *
   * ÍCONES flutuantes da seção 2
   * Posição sorteada a cada visita, só nos vãos: cada candidato que
   * encosta no texto (olho, título, passos) ou em outro ícone é
   * descartado. O que não achar lugar fica escondido, em vez de cair em
   * cima de uma frase. Refaz ao redimensionar.
   * ---------------------------------------------------------------- */
  var secaoComo = document.getElementById("como-funciona");
  var nuvem = document.querySelector("[data-icones]");
  var icones = nuvem ? Array.prototype.slice.call(nuvem.querySelectorAll(".ico-flutua")) : [];

  function espalharIcones() {
    if (!secaoComo || !icones.length) return;
    var base = secaoComo.getBoundingClientRect();
    var W = base.width, H = base.height;
    var lado = icones[0].offsetWidth || 48;
    var folga = W < 700 ? 10 : 18;
    var ocupados = [];
    secaoComo.querySelectorAll(".olho, .titulo-grande .palavra, .passos li").forEach(function (el) {
      var r = el.getBoundingClientRect();
      // o texto pode estar 24px abaixo, esperando a animação de entrada:
      // reserva as duas posições, antes e depois de subir
      ocupados.push({ x: r.left - base.left - folga, y: r.top - base.top - folga - 24, w: r.width + folga * 2, h: r.height + folga * 2 + 24 });
    });
    // a linha fina em cima de cada passo também conta como ocupada
    secaoComo.querySelectorAll(".passos, .passos li").forEach(function (el) {
      var rt = el.getBoundingClientRect();
      ocupados.push({ x: rt.left - base.left, y: rt.top - base.top - folga, w: rt.width, h: folga * 2 });
    });
    var limite = W < 700 ? 12 : icones.length;   // no celular, menos ícones
    var bate = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };
    var ordem = icones.slice().sort(function () { return Math.random() - 0.5; });
    var postos = 0;
    ordem.forEach(function (ic) {
      var achou = null;
      for (var t = 0; t < 120 && !achou && postos < limite; t++) {
        var c = { x: 8 + Math.random() * (W - lado - 16), y: 8 + Math.random() * (H - lado - 16), w: lado, h: lado };
        var livre = true;
        for (var i = 0; i < ocupados.length; i++) { if (bate(c, ocupados[i])) { livre = false; break; } }
        if (livre) achou = c;
      }
      if (achou) {
        ic.style.left = achou.x.toFixed(0) + "px";
        ic.style.top = achou.y.toFixed(0) + "px";
        ic.classList.add("is-posto");
        postos++;
        ocupados.push({ x: achou.x - 14, y: achou.y - 14, w: lado + 28, h: lado + 28 });
      } else {
        ic.classList.remove("is-posto");
      }
    });
  }
  if (icones.length) {
    var pronto = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    pronto.then(function () { requestAnimationFrame(espalharIcones); });
    var tempoResize, larguraAntes = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === larguraAntes) return;   // barra do celular sumindo não conta
      larguraAntes = window.innerWidth;
      clearTimeout(tempoResize);
      tempoResize = setTimeout(espalharIcones, 200);
    });
  }

  // e fogem do cursor quando ele passa perto
  if (icones.length && !reduzido && ponteiroFino && secaoComo) {
    var raio = 120;
    secaoComo.addEventListener("pointermove", function (ev) {
      icones.forEach(function (ic) {
        var r = ic.getBoundingClientRect();
        var dx = (r.left + r.width / 2) - ev.clientX, dy = (r.top + r.height / 2) - ev.clientY;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < raio) {
          var f = (1 - d / raio) * 28, ang = Math.atan2(dy, dx);
          ic.style.transform = "translate(" + (Math.cos(ang) * f).toFixed(1) + "px," + (Math.sin(ang) * f).toFixed(1) + "px)";
        } else {
          ic.style.transform = "";
        }
      });
    });
    secaoComo.addEventListener("pointerleave", function () {
      icones.forEach(function (ic) { ic.style.transform = ""; });
    });
  }

  // brilho do card de serviço e do cartão de passo segue o mouse
  document.querySelectorAll(".servicos__grade a, .passos li").forEach(function (card) {
    card.addEventListener("pointermove", function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      card.style.setProperty("--my", (ev.clientY - r.top) + "px");
    });
  });

  /* ---------------------------------------------------------------- *
   * CAMINHO DO CLIENTE (seção 01): pesquisa digitada, resultado aceso,
   * mensagem chegando no WhatsApp. Em loop, só enquanto está na tela.
   * ---------------------------------------------------------------- */
  var caminho = document.querySelector("[data-caminho]");
  if (caminho && !reduzido && "IntersectionObserver" in window) {
    var passos = caminho.querySelectorAll(".caminho__passo");
    var campo = caminho.querySelector("[data-digita]");
    var BUSCAS = ["eletricista perto de mim", "contabilidade em Itabira", "dentista aberto agora", "lavanderia perto de mim", "loja de carros em Itabira"];
    var busca = 0, naTela = false, rodando = false;
    var espera = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
    var marcar = function (n) {
      caminho.setAttribute("data-etapa", n);
      passos.forEach(function (p, i) {
        p.classList.toggle("is-ativo", i + 1 === n);
        p.classList.toggle("is-feito", i + 1 < n);
      });
    };
    var ciclo = function () {
      if (!naTela) { rodando = false; return; }
      rodando = true;
      var texto = BUSCAS[busca++ % BUSCAS.length];
      marcar(1);
      campo.textContent = "";
      var i = 0;
      var digitar = function () {
        return new Promise(function (ok) {
          (function letra() {
            if (i > texto.length) return ok();
            campo.textContent = texto.slice(0, i++);
            setTimeout(letra, 45 + Math.random() * 50);
          })();
        });
      };
      espera(400).then(digitar).then(function () { return espera(650); })
        .then(function () { marcar(2); return espera(1500); })
        .then(function () { caminho.classList.add("is-digitando"); marcar(3); return espera(1300); })
        .then(function () { caminho.classList.remove("is-digitando"); return espera(2600); })
        .then(function () { marcar(0); return espera(500); })
        .then(ciclo);
    };
    new IntersectionObserver(function (e) {
      naTela = e[0].isIntersecting;
      if (naTela && !rodando) ciclo();
    }, { threshold: 0.3 }).observe(caminho);
  }

  /* ---------------------------------------------------------------- *
   * CURSOR: mira do sistema + rastro roxo curto (mesmo do André Teclas)
   * A linha desenha o caminho do mouse e some em 320 ms, com a ponta mais
   * grossa que a cauda.
   * ---------------------------------------------------------------- */
  if (ponteiroFino && !reduzido) {
    var tela = document.createElement("canvas");
    tela.id = "rastro";
    tela.setAttribute("aria-hidden", "true");
    document.body.appendChild(tela);
    document.body.classList.add("cursor-proprio");
    var c = tela.getContext("2d");
    var pontos = [];
    var VIDA = 320;

    var dimensionar = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      tela.width = window.innerWidth * dpr;
      tela.height = window.innerHeight * dpr;
      tela.style.width = window.innerWidth + "px";
      tela.style.height = window.innerHeight + "px";
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    dimensionar();
    window.addEventListener("resize", dimensionar);

    window.addEventListener("mousemove", function (ev) {
      pontos.push({ x: ev.clientX, y: ev.clientY, t: performance.now() });
      if (pontos.length > 40) pontos.shift();
    }, { passive: true });

    (function desenhar() {
      requestAnimationFrame(desenhar);
      var agora = performance.now();
      while (pontos.length && agora - pontos[0].t > VIDA) pontos.shift();
      c.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (pontos.length < 3) return;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.shadowColor = "rgba(150, 134, 255, .6)";
      c.shadowBlur = 8;
      for (var i = 1; i < pontos.length - 1; i++) {
        var p0 = pontos[i - 1], p1 = pontos[i], p2 = pontos[i + 1];
        var vida = 1 - (agora - p1.t) / VIDA;
        if (vida <= 0) continue;
        c.beginPath();
        c.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
        c.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        c.strokeStyle = "rgba(160, 146, 255, " + (vida * 0.9).toFixed(3) + ")";
        c.lineWidth = 0.5 + vida * 2.4;
        c.stroke();
      }
      c.shadowBlur = 0;
    })();
  }
})();
