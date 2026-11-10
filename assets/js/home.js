/* ==========================================================================
   Home - Marcelo Ribeiro
   1. Entradas: títulos palavra por palavra, blocos subindo, contato em
      cascata com a foto abrindo na diagonal.
   2. Filme do hero, topo que vira vidro creme depois dele, caminho do
      cliente no tema do Google.
   3. Serviços com mídia (vídeos, carrossel de sites, Google e gerenciador
      de anúncios animados) e a conversa do banner da automação.
   Os ícones flutuantes e o rastro roxo do cursor saíram no tema claro
   (09/11/2026).
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

  // NÚMEROS: contam de zero até o valor do HTML quando a faixa entra na tela,
  // um atrás do outro. A largura final fica reservada pra o "%" não andar.
  var numeros = document.querySelector("[data-numeros]");
  if (numeros && !reduzido && "IntersectionObserver" in window) {
    var itens = Array.prototype.slice.call(numeros.querySelectorAll("li"));
    itens.forEach(function (li) {
      var n = li.querySelector("[data-conta]");
      n.style.display = "inline-block";
      // dígito tabular = 1ch; o .05em é o letter-spacing negativo do número
      var dig = n.textContent.trim().length;
      n.style.minWidth = "calc(" + dig + "ch - " + (dig * 0.05).toFixed(2) + "em)";
      n.textContent = "0";
      li.style.setProperty("--p", 0);
    });
    var contar = function (li, atraso) {
      var n = li.querySelector("[data-conta]");
      var fim = parseInt(n.getAttribute("data-conta"), 10);
      var dur = 1900, inicio = null;
      var passo = function (t) {
        if (inicio === null) inicio = t;
        var x = Math.min(1, Math.max(0, (t - inicio) / dur));
        var e = x === 1 ? 1 : 1 - Math.pow(2, -10 * x);   // sai rápido e assenta devagar
        n.textContent = Math.round(fim * e);
        li.style.setProperty("--p", e.toFixed(3));
        if (x < 1) requestAnimationFrame(passo);
      };
      setTimeout(function () { requestAnimationFrame(passo); }, atraso);
    };
    var ioNum = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      ioNum.disconnect();
      itens.forEach(function (li, i) { contar(li, i * 180); });
    }, { threshold: 0.35 });
    ioNum.observe(numeros);
  }

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

    // cor na foto: só quando metade dela já está na tela, depois da diagonal
    var molduraFoto = contato.querySelector(".contato__foto");
    if (molduraFoto) {
      if ("IntersectionObserver" in window && !reduzido) {
        var ioCor = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { fotoPronta.then(function () { molduraFoto.classList.add("is-cor"); }); ioCor.disconnect(); }
        }, { threshold: 0.5 });
        ioCor.observe(molduraFoto);
      } else {
        molduraFoto.classList.add("is-cor");
      }
    }
  }

  /* ---------------------------------------------------------------- *
   * HERO: filme e entrada
   * ---------------------------------------------------------------- */
  var heroVideo = document.querySelector("[data-hero-video]");
  function tocarVideo() {
    if (!heroVideo || reduzido) return;
    heroVideo.addEventListener("playing", function () { heroVideo.classList.add("is-tocando"); }, { once: true });
    var p = heroVideo.play();
    if (p && p.catch) p.catch(function () {});
  }

  function entrarSite() {
    html.classList.add("site-pronto");
    var titulo = document.querySelector(".hero__titulo");
    if (titulo) titulo.classList.add("is-visivel");
    tocarVideo();
  }

  // dois quadros de espera: o navegador precisa pintar o estado inicial
  // (tudo escondido) antes, senão a cascata do hero não tem de onde animar
  requestAnimationFrame(function () { requestAnimationFrame(entrarSite); });

  /* ---------------------------------------------------------------- *
   * TOPO sólido ao rolar
   * ---------------------------------------------------------------- */
  var topo = document.querySelector("[data-topo]");
  var heroTopo = document.querySelector(".hero");
  var limiteTopo = 40;
  function medirTopo() { limiteTopo = heroTopo ? Math.max(40, heroTopo.offsetHeight - 80) : 40; ajustarTopo(); }
  // seção escura embaixo do topo (banner, contato, rodapé): vidro escuro
  var escuras = Array.prototype.slice.call(document.querySelectorAll("main > .escuro:not(.hero), .rodape.escuro"));
  function ajustarTopo() {
    if (!topo) return;
    topo.classList.toggle("is-solido", window.scrollY > limiteTopo);
    var sobreEscura = escuras.some(function (el) { var r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    topo.classList.toggle("is-escuro", sobreEscura);
  }
  window.addEventListener("scroll", ajustarTopo, { passive: true });
  window.addEventListener("resize", medirTopo);
  medirTopo();
  ajustarTopo();

  /* ---------------------------------------------------------------- *
   * MENU do celular: o traço abre e fecha; link, Esc ou tela larga fecham
   * ---------------------------------------------------------------- */
  var menuBotao = document.querySelector("[data-menu-botao]");
  var menu = document.querySelector("[data-menu]");
  function abrirMenu(abrir) {
    if (!menuBotao || !menu) return;
    document.documentElement.classList.toggle("menu-aberto", abrir);
    menuBotao.setAttribute("aria-expanded", abrir ? "true" : "false");
    menuBotao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  }
  if (menuBotao && menu) {
    menuBotao.addEventListener("click", function () {
      abrirMenu(menuBotao.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) abrirMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.documentElement.classList.contains("menu-aberto")) { abrirMenu(false); menuBotao.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) abrirMenu(false); });
  }


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
   * CAMINHO DO CLIENTE (seção Sobre): pesquisa digitada, resultado aceso,
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
   * Roda uma função em loop só enquanto o elemento está na tela.
   * ciclo(proximo) faz uma volta e chama proximo() no fim; quando o
   * elemento sai da tela, a volta seguinte não começa.
   * ---------------------------------------------------------------- */
  var espera = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
  function emLoopNaTela(el, ciclo, limiar) {
    if (!el || reduzido || !("IntersectionObserver" in window)) return;
    var naTela = false, rodando = false;
    var volta = function () {
      if (!naTela) { rodando = false; return; }
      rodando = true;
      ciclo(volta);
    };
    new IntersectionObserver(function (e) {
      naTela = e[0].isIntersecting;
      if (naTela && !rodando) volta();
    }, { threshold: limiar || 0.35 }).observe(el);
  }

  /* ---------------------------------------------------------------- *
   * SERVIÇOS: vídeos só tocam com o cartão na tela
   * ---------------------------------------------------------------- */
  var videosServico = document.querySelectorAll("[data-video-servico]");
  if (videosServico.length && !reduzido && "IntersectionObserver" in window) {
    var ioVideo = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
        else e.target.pause();
      });
    }, { threshold: 0.3 });
    videosServico.forEach(function (v) { ioVideo.observe(v); });
  }

  /* sites: o monitor manda (toca e pausa com o cartão na tela); o celular
     acompanha o tempo dele e a barra do navegador troca o nome do cliente
     no meio de cada transição do vídeo (6,3 s e 12,4 s) */
  var sitesPc = document.querySelector("[data-sites-pc]");
  var sitesCel = document.querySelector("[data-sites-cel]");
  var sitesNome = document.querySelector("[data-sites-nome]");
  if (sitesPc && sitesCel && sitesNome) {
    var SITES = [[0, "Clínica Bem Viver"], [6.3, "André Silva Teclas"], [12.4, "Ana Flávia Araújo Estética"]];
    sitesPc.addEventListener("play", function () {
      sitesCel.currentTime = sitesPc.currentTime;
      var p = sitesCel.play(); if (p && p.catch) p.catch(function () {});
    });
    sitesPc.addEventListener("pause", function () { sitesCel.pause(); });
    sitesPc.addEventListener("timeupdate", function () {
      var t = sitesPc.currentTime, nome = SITES[0][1];
      SITES.forEach(function (s) { if (t >= s[0]) nome = s[1]; });
      if (sitesNome.textContent !== nome) sitesNome.textContent = nome;
      if (Math.abs(sitesCel.currentTime - t) > 0.25) sitesCel.currentTime = t;
    });
  }

  /* Google Ads: digita a busca, mostra o anúncio no topo, abre o Maps */
  var gAnim = document.querySelector('[data-anima="google"]');
  if (gAnim) {
    var gCampo = gAnim.querySelector("[data-g-digita]");
    var G_BUSCA = "dentista em itabira";
    emLoopNaTela(gAnim, function (proximo) {
      gAnim.setAttribute("data-etapa", "1");
      gCampo.textContent = "";
      var i = 0;
      espera(500).then(function () {
        return new Promise(function (ok) {
          (function letra() {
            if (i > G_BUSCA.length) return ok();
            gCampo.textContent = G_BUSCA.slice(0, i++);
            setTimeout(letra, 55 + Math.random() * 45);
          })();
        });
      })
        .then(function () { return espera(600); })
        .then(function () { gAnim.setAttribute("data-etapa", "2"); return espera(2600); })
        .then(function () { gAnim.setAttribute("data-etapa", "3"); return espera(3600); })
        .then(proximo);
    });
  }

  /* Facebook e Instagram Ads: liga a campanha, os números sobem */
  var mAnim = document.querySelector('[data-anima="meta"]');
  if (mAnim) {
    var chave = mAnim.querySelector(".m-linha--alvo .m-chave");
    var statusM = mAnim.querySelector("[data-m-status]");
    var contas = mAnim.querySelectorAll("[data-m-conta]");
    var mostrar = function (el, v) {
      el.textContent = el.hasAttribute("data-m-real")
        ? "R$ " + v.toFixed(2).replace(".", ",")
        : Math.round(v).toLocaleString("pt-BR");
    };
    var zerar = function () {
      mAnim.classList.remove("is-ligada");
      chave.classList.remove("is-on");
      statusM.textContent = "Desativada";
      statusM.classList.remove("is-ativa");
      contas.forEach(function (el) { mostrar(el, 0); });
    };
    var subir = function (ms) {
      return new Promise(function (ok) {
        var ini = performance.now();
        (function passo() {
          var t = Math.min(1, (performance.now() - ini) / ms);
          var e = 1 - Math.pow(1 - t, 3);
          contas.forEach(function (el) { mostrar(el, parseFloat(el.getAttribute("data-m-conta")) * e); });
          if (t < 1) setTimeout(passo, 40); else ok();
        })();
      });
    };
    zerar();
    emLoopNaTela(mAnim, function (proximo) {
      zerar();
      espera(900)
        .then(function () { chave.classList.add("is-on"); return espera(450); })
        .then(function () {
          statusM.textContent = "Ativa";
          statusM.classList.add("is-ativa");
          mAnim.classList.add("is-ligada");
          return subir(2400);
        })
        .then(function () { return espera(2600); })
        .then(proximo);
    });
  }

  /* ---------------------------------------------------------------- *
   * BANNER DA AUTOMAÇÃO: a conversa no celular. Abre já preenchida
   * (a conversa de sábado), e a de domingo roda sozinha: a assistente
   * "digita" antes de cada resposta e os cartões em volta do celular
   * aparecem junto. Quando o visitante toca numa pergunta pronta, o
   * loop para de vez e o celular passa a responder a ele.
   * ---------------------------------------------------------------- */
  var chat = document.querySelector("[data-chat]");
  if (chat) {
    var corpo = chat.querySelector("[data-chat-corpo]");
    var statusChat = chat.querySelector("[data-chat-status]");
    var perguntas = chat.querySelector("[data-chat-perguntas]");
    var selos = Array.prototype.slice.call(document.querySelectorAll("[data-selo]"));
    var LINK_ZAP = "https://wa.me/5531995045274?text=Ol%C3%A1%2C%20Marcelo%21%20Testei%20a%20assistente%20no%20seu%20site%20e%20quero%20uma%20assim%20no%20WhatsApp%20da%20minha%20empresa.";
    var ANTES = [
      { de: "dia", txt: "Sábado" },
      { de: "cli", txt: "Amei o resultado da hidratação, obrigada!", h: "16:20" },
      { de: "ia", txt: "Que bom, Patrícia! Qualquer coisa é só chamar aqui.", h: "16:20" },
      { de: "dia", txt: "Domingo" }
    ];
    var CONVERSA = [
      { de: "cli", txt: "Oi! Quanto fica a limpeza de pele?", h: "22:47" },
      { de: "ia", txt: "Oi, Patrícia! A limpeza de pele profunda sai por R$ 180 e leva uns 50 minutos.", h: "22:47", selo: [1] },
      { de: "ia", txt: "Quer que eu veja um horário pra você essa semana?", h: "22:47" },
      { de: "cli", txt: "Sexta à tarde dá?", h: "22:48" },
      { de: "ia", txt: "Sexta às 15h está livre. Posso reservar no seu nome?", h: "22:48" },
      { de: "cli", txt: "Pode sim!", h: "22:48" },
      { de: "ia", txt: "Prontinho, reservado. Te mando um lembrete na quinta.", h: "22:48", selo: [2, 3] },
      { de: "aviso", txt: "Horário marcado e passado pra equipe" }
    ];
    var RESPOSTAS = [
      { p: "Abre sábado?", r: ["Abrimos sim, das 9h às 14h.", "Quer que eu veja um horário pra você no sábado?"] },
      { p: "Aceita cartão?", r: ["Aceita sim! Pix, débito e crédito em até 3x sem juros."] },
      { p: "Quero falar com alguém", r: ["Claro! Já chamei a Juliana da recepção. Ela te responde por aqui em instantes."], aviso: "Conversa passada pra equipe" }
    ];
    var poe = function (el) {
      corpo.appendChild(el);
      // o que passa do topo some cortado, como num chat; aqui só limpa o DOM
      while (corpo.children.length > 14) corpo.removeChild(corpo.firstChild);
    };
    var bolha = function (m, fixa) {
      var el = document.createElement(m.de === "aviso" || m.de === "dia" ? "span" : "p");
      if (fixa) el.classList.add("is-fixa");
      if (m.de === "dia") {
        el.classList.add("zap-dia");
        el.textContent = m.txt;
      } else if (m.de === "aviso") {
        el.classList.add("zap-aviso");
        el.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>';
        el.appendChild(document.createTextNode(m.txt));
      } else {
        el.classList.add("zap-msg", "zap-msg--" + m.de);
        el.textContent = m.txt;
        var hora = document.createElement("time");
        hora.textContent = m.h;
        el.appendChild(hora);
      }
      return el;
    };
    var mostraSelos = function (lista) {
      (lista || []).forEach(function (n, i) {
        setTimeout(function () {
          selos.forEach(function (s) { if (+s.getAttribute("data-selo") === n) s.classList.add("is-visivel"); });
        }, i * 700);
      });
    };
    var abrir = function () {
      corpo.textContent = "";
      ANTES.forEach(function (m) { poe(bolha(m, true)); });
    };

    // a assistente digita e responde. No loop automático (auto = true),
    // se o visitante assumiu no meio da espera, a volta é abandonada.
    var assumiu = false, PAROU = {};
    var digita = function (m, auto) {
      var dig = document.createElement("span");
      dig.className = "zap-digitando";
      dig.innerHTML = "<i></i><i></i><i></i>";
      poe(dig);
      statusChat.textContent = "digitando...";
      statusChat.classList.add("is-digitando");
      return espera(reduzido ? 250 : 1100 + m.txt.length * 12).then(function () {
        dig.remove();
        if (auto && assumiu) throw PAROU;
        statusChat.textContent = "online";
        statusChat.classList.remove("is-digitando");
        poe(bolha(m));
      });
    };

    abrir();
    if (reduzido) {
      // sem animação: a conversa de domingo já aparece inteira, com os cartões
      CONVERSA.forEach(function (m) { poe(bolha(m, true)); });
      selos.forEach(function (s) { s.classList.add("is-visivel"); });
    }
    emLoopNaTela(chat, function (proximo) {
      if (assumiu) return;
      abrir();
      selos.forEach(function (s) { s.classList.remove("is-visivel"); });
      var p = espera(700);
      CONVERSA.forEach(function (m) {
        p = p.then(function () {
          if (assumiu) throw PAROU;
          if (m.de !== "ia") { poe(bolha(m)); return espera(m.de === "cli" ? 1300 : 3600); }
          return digita(m, true).then(function () { mostraSelos(m.selo); return espera(1000); });
        });
      });
      p.then(proximo, function () {});
    }, 0.3);

    // perguntas prontas
    var ocupado = false, minuto = 49;
    var botoes = function (ligar) {
      perguntas.querySelectorAll("button").forEach(function (b) { b.disabled = !ligar; });
    };
    perguntas.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-pergunta]");
      if (!b || ocupado) return;
      ocupado = true;
      if (!assumiu) {
        assumiu = true;
        perguntas.classList.add("is-usado");
        corpo.querySelectorAll(".zap-digitando").forEach(function (d) { d.remove(); });
        corpo.removeAttribute("aria-hidden");
        corpo.setAttribute("aria-live", "polite");
      }
      var item = RESPOSTAS[+b.getAttribute("data-pergunta")];
      var h = "22:" + Math.min(59, minuto++);
      b.remove();
      botoes(false);
      poe(bolha({ de: "cli", txt: item.p, h: h }));
      var p = espera(reduzido ? 0 : 450);
      item.r.forEach(function (txt) {
        p = p.then(function () { return digita({ de: "ia", txt: txt, h: h }, false); })
             .then(function () { return espera(reduzido ? 0 : 350); });
      });
      if (item.aviso) p = p.then(function () { poe(bolha({ de: "aviso", txt: item.aviso })); });
      p.then(function () {
        ocupado = false;
        botoes(true);
        if (!perguntas.querySelector("button")) {
          // acabaram as perguntas: o espaço vira o convite
          perguntas.innerHTML = "";
          var cta = document.createElement("a");
          cta.className = "zap-cel__cta";
          cta.href = LINK_ZAP;
          cta.target = "_blank";
          cta.rel = "noopener";
          cta.textContent = "Quero uma assistente assim";
          perguntas.appendChild(cta);
        } else {
          var prox = perguntas.querySelector("button");
          if (prox && document.activeElement === document.body) prox.focus({ preventScroll: true });
        }
      });
    });
  }
})();
