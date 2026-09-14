/* ==========================================================================
   Marcelo Ribeiro — interações compartilhadas do site (sem dependência)
   Reveal no scroll, spotlight do cursor na hero, tilt sutil nos cards.
   Carregado em toda página junto de style.css. O estado "escondido" do
   [data-reveal] só existe com html.js aplicado (script síncrono no <head> de
   cada página) — assim, sem JS, nada fica invisível.
   ========================================================================== */
(function () {
  "use strict";
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- topo transparente sobre a hero: solidifica ao rolar ---- */
  var topoTransp = document.querySelector(".topo--transparente");
  if (topoTransp) {
    var marcarSolido = function () {
      topoTransp.classList.toggle("topo--solido", window.scrollY > 40);
    };
    document.addEventListener("scroll", marcarSolido, { passive: true });
    marcarSolido();
  }

  /* ---- reveal ao rolar ----
     data-margem (px) atrasa o gatilho de um elemento específico: em vez de
     um grupo inteiro (ex: os 4 passos de "como funciona") aparecer junto só
     porque estão lado a lado na mesma altura, cada um exige um pouco mais de
     rolagem que o anterior — some aparecendo um de cada vez, de verdade,
     conforme o dedo rola, não só com atraso de CSS (que dispara tudo junto,
     só que em cascata rápida demais pra notar). */
  var alvos = document.querySelectorAll("[data-reveal]");
  if (alvos.length) {
    if ("IntersectionObserver" in window) {
      var tetoMargem = Math.max(window.innerHeight * .5, 100);
      alvos.forEach(function (el) {
        var margem = Math.min(60 + (parseInt(el.getAttribute("data-margem"), 10) || 0), tetoMargem);
        var io = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          });
        }, { threshold: .12, rootMargin: "0px 0px -" + margem + "px 0px" });
        io.observe(el);
      });
    } else {
      alvos.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  /* ---- spotlight do cursor nos blocos escuros de destaque ---- */
  if (!reduzido) {
    document.querySelectorAll(".hero, .hero-servico, .secao--cta").forEach(function (bloco) {
      bloco.addEventListener("pointermove", function (ev) {
        if (ev.pointerType === "touch") return;
        var r = bloco.getBoundingClientRect();
        bloco.style.setProperty("--x", (((ev.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        bloco.style.setProperty("--y", (((ev.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
    });
  }

  /* ---- tilt sutil nos cards ao passar o mouse (só em dispositivo com hover) ---- */
  if (!reduzido && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (ev) {
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - .5;
        var py = (ev.clientY - r.top) / r.height - .5;
        card.style.transform = "perspective(800px) rotateX(" + (py * -6).toFixed(2) + "deg) rotateY(" + (px * 6).toFixed(2) + "deg) translateY(-3px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---- ícones flutuantes do FAQ: recuam do cursor, igual ao modelo de
     referência (ícones se afastando do mouse quando ele passa perto). Sem
     spring de verdade (não tem lib aqui): a "mola" é só a transition CSS do
     .ico-flutua reagindo a um novo translate a cada pointermove. */
  var faqSecao = document.getElementById("perguntas");
  var faqIcones = faqSecao ? Array.prototype.slice.call(faqSecao.querySelectorAll(".ico-flutua")) : [];
  if (faqIcones.length && !reduzido && window.matchMedia("(hover: hover)").matches) {
    var raioRepulsao = 110;
    faqSecao.addEventListener("pointermove", function (ev) {
      faqIcones.forEach(function (ic) {
        var r = ic.getBoundingClientRect();
        var dx = (r.left + r.width / 2) - ev.clientX;
        var dy = (r.top + r.height / 2) - ev.clientY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < raioRepulsao) {
          var forca = (1 - dist / raioRepulsao) * 26;
          var ang = Math.atan2(dy, dx);
          ic.style.transform = "translate(" + (Math.cos(ang) * forca).toFixed(1) + "px," + (Math.sin(ang) * forca).toFixed(1) + "px)";
        } else {
          ic.style.transform = "";
        }
      });
    });
    faqSecao.addEventListener("pointerleave", function () {
      faqIcones.forEach(function (ic) { ic.style.transform = ""; });
    });
  }

  /* ---- carrossel de serviços: pilha por índice, tipo coverflow ----
     Posição absoluta pra cada card, calculada a partir da distância (em
     "casas") até o índice atual — não é scroll nativo, por isso dá pra
     empilhar os vizinhos quase encostados no card do centro. */
  var palco = document.querySelector(".carrossel__palco");
  if (palco) {
    var itensCarrossel = Array.prototype.slice.call(palco.querySelectorAll(".carrossel__item"));
    var totalItens = itensCarrossel.length;
    var indiceAtual = 0;
    var ambienteImg = document.querySelector(".carrossel__ambiente img");
    var fotoAtual = ambienteImg ? ambienteImg.getAttribute("src") : null;

    var posicionar = function () {
      itensCarrossel.forEach(function (item, i) {
        var offset = i - indiceAtual;
        if (offset > totalItens / 2) offset -= totalItens;
        if (offset < -totalItens / 2) offset += totalItens;
        var abs = Math.abs(offset);
        var sinal = offset < 0 ? -1 : 1;

        var deslocPct, escala, rotacao, opacidade, zIndex;
        if (abs === 0) {
          deslocPct = 0; escala = 1; rotacao = 0; opacidade = 1; zIndex = 30;
        } else if (abs === 1) {
          deslocPct = sinal * 58; escala = .82; rotacao = sinal * -30; opacidade = .55; zIndex = 20;
        } else if (abs === 2) {
          deslocPct = sinal * 108; escala = .64; rotacao = sinal * -38; opacidade = .28; zIndex = 10;
        } else {
          deslocPct = sinal * 140; escala = .5; rotacao = sinal * -40; opacidade = 0; zIndex = 0;
        }

        var transform = "translateX(calc(-50% + " + deslocPct + "%)) scale(" + escala + ")";
        if (!reduzido) { transform += " rotateY(" + rotacao + "deg)"; }
        item.style.transform = transform;
        item.style.opacity = opacidade;
        item.style.zIndex = zIndex;
        item.style.pointerEvents = abs > 2 ? "none" : "auto";
        item.classList.toggle("is-centro", offset === 0);
      });

      if (ambienteImg) {
        var foto = itensCarrossel[indiceAtual].querySelector(".carrossel__foto");
        if (foto && foto.src !== fotoAtual) {
          fotoAtual = foto.src;
          ambienteImg.src = fotoAtual;
        }
      }
    };

    itensCarrossel.forEach(function (item, i) {
      item.addEventListener("click", function (ev) {
        if (i !== indiceAtual) {
          ev.preventDefault();
          indiceAtual = i;
          posicionar();
        }
      });
    });

    document.querySelectorAll(".carrossel__seta").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var dir = botao.classList.contains("carrossel__seta--esq") ? -1 : 1;
        indiceAtual = (indiceAtual + dir + totalItens) % totalItens;
        posicionar();
      });
    });

    var toqueX = null;
    palco.addEventListener("touchstart", function (ev) { toqueX = ev.touches[0].clientX; }, { passive: true });
    palco.addEventListener("touchend", function (ev) {
      if (toqueX === null) return;
      var diff = ev.changedTouches[0].clientX - toqueX;
      toqueX = null;
      if (Math.abs(diff) < 40) return;
      indiceAtual = (indiceAtual + (diff < 0 ? 1 : -1) + totalItens) % totalItens;
      posicionar();
    }, { passive: true });

    posicionar();
  }
})();
