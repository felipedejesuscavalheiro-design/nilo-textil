/* ============================================================
   CAVELLE — Efeitos editoriais
   · Títulos que surgem palavra por palavra
   · Parallax suave nas fotos grandes
   · Faixas em movimento contínuo (marquee)
   Tudo desliga com "reduzir movimento" do sistema. Sem JavaScript,
   o conteúdo aparece normalmente (os estados ocultos dependem de html.js).
   ============================================================ */
(function () {
  'use strict';
  const raiz = document.documentElement;
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  raiz.classList.add('js');

  // ── Divide um título em palavras mascaradas ─────────────
  function dividir(el) {
    if (el.dataset.dividido) return;
    el.dataset.dividido = '1';
    let i = 0;
    Array.from(el.childNodes).forEach((no) => {
      if (no.nodeType !== 3) return; // mantém <br> e outros elementos
      const frag = document.createDocumentFragment();
      no.textContent.split(/(\s+)/).forEach((parte) => {
        if (!parte) return;
        if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(' ')); return; }
        const fora = document.createElement('span');
        fora.className = 'palavra';
        const dentro = document.createElement('span');
        dentro.textContent = parte;
        dentro.style.setProperty('--i', i++);
        fora.appendChild(dentro);
        frag.appendChild(fora);
      });
      no.replaceWith(frag);
    });
  }

  // Quais elementos recebem cada efeito (um lugar só para ajustar)
  document.querySelectorAll('.cabeca-pagina .titulo-display, .titulo-secao, .lifestyle__texto .titulo-display, .sobre-bloco__texto .titulo-display, .sobre-hero__texto .titulo-display, .citacao blockquote, .confirmacao .titulo-display')
    .forEach((el) => el.setAttribute('data-revela', ''));
  document.querySelectorAll('.lifestyle__foto, .sobre-bloco__foto').forEach((el) => { if (!el.dataset.parallax) el.dataset.parallax = '36'; });
  const hero = document.querySelector('.sobre-hero');
  if (hero) hero.dataset.parallax = '60';

  // Carrossel: divide os títulos e faz a entrada do primeiro banner
  document.querySelectorAll('.slide__titulo').forEach(dividir);
  const primeiro = document.querySelector('.hero .slide.ativo');
  if (primeiro && !calmo) {
    primeiro.classList.remove('ativo');
    void primeiro.offsetWidth;
    requestAnimationFrame(() => primeiro.classList.add('ativo'));
  }

  const titulos = document.querySelectorAll('[data-revela]');
  titulos.forEach(dividir);
  if (calmo || !('IntersectionObserver' in window)) {
    titulos.forEach((t) => t.classList.add('revelado'));
  } else {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('revelado'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    titulos.forEach((t) => io.observe(t));
  }

  // ── Marquee: duplica o conteúdo para o loop ficar contínuo ──
  document.querySelectorAll('[data-marquee]').forEach((m) => {
    const trilho = m.firstElementChild;
    if (!trilho || trilho.dataset.duplicado) return;
    trilho.dataset.duplicado = '1';
    trilho.innerHTML += trilho.innerHTML;
    Array.from(trilho.children).slice(trilho.children.length / 2).forEach((c) => c.setAttribute('aria-hidden', 'true'));
  });

  // ── Parallax suave (só desktop) ─────────────────────────
  const alvos = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!calmo && alvos.length && window.matchMedia('(min-width: 901px)').matches) {
    let pendente = false;
    const mover = () => {
      pendente = false;
      const vh = window.innerHeight;
      alvos.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
        const forca = Number(el.dataset.parallax) || 40;
        const img = el.querySelector('img');
        if (img) img.style.transform = `translate3d(0, ${(-p * forca).toFixed(1)}px, 0) scale(1.1)`;
      });
    };
    const pedir = () => { if (!pendente) { pendente = true; requestAnimationFrame(mover); } };
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    mover();
  }
})();
