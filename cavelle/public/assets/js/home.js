/* CAVELLE — Home: carrossel, New In e Instagram */
(function () {
  'use strict';
  const { $, $$, card, PRODUTOS, CFG, I, revelar } = window.CV;

  // ── Carrossel ───────────────────────────────────────────
  const hero = $('.hero');
  const slides = $$('.slide', hero);
  const pontos = $('.hero__pontos', hero);
  let atual = 0;
  let decorrido = 0;
  const TEMPO = 6500; // ms por banner

  pontos.innerHTML = slides.map((_, i) => `<button class="hero__ponto${i ? '' : ' ativo'}" role="tab" aria-label="Banner ${i + 1}" aria-selected="${!i}"><i></i></button>`).join('');
  const botoes = $$('.hero__ponto', pontos);

  function ir(n) {
    const prox = (n + slides.length) % slides.length;
    decorrido = 0;
    if (prox === atual) return;
    slides[atual].classList.remove('ativo');
    botoes[atual].classList.remove('ativo');
    botoes[atual].setAttribute('aria-selected', 'false');
    botoes[atual].style.setProperty('--prog', 0);
    atual = prox;
    const s = slides[atual];
    const img = $('img', s);
    if (img && img.loading === 'lazy') img.loading = 'eager';
    s.classList.add('ativo');
    botoes[atual].classList.add('ativo');
    botoes[atual].setAttribute('aria-selected', 'true');
    hero.dataset.tom = s.dataset.tom;
  }

  // Avanço automático com relógio próprio (funciona em qualquer navegador).
  // Pausa com o mouse em cima (computador), com o dedo na tela e com a aba escondida.
  let pausas = 0;
  let ultimo = performance.now();
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const passo = (t) => {
    const dt = t - ultimo;
    ultimo = t;
    if (!pausas && !document.hidden && !calmo) {
      decorrido += dt;
      botoes[atual].style.setProperty('--prog', Math.min(1, decorrido / TEMPO));
      if (decorrido >= TEMPO) ir(atual + 1);
    }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  const parar = () => { pausas = 1; };
  const iniciar = () => { pausas = 0; };

  botoes.forEach((b, i) => b.addEventListener('click', () => ir(i)));
  $('[data-hero="ant"]').addEventListener('click', () => ir(atual - 1));
  $('[data-hero="prox"]').addEventListener('click', () => ir(atual + 1));
  if (window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mouseenter', parar);
    hero.addEventListener('mouseleave', iniciar);
  }

  // Deslizar com o dedo
  let x0 = null;
  let y0 = null;
  hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; parar(); }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) ir(atual + (dx < 0 ? 1 : -1));
    x0 = null;
    iniciar();
  });

  // Pré-carrega os outros banners depois que a página abriu
  window.addEventListener('load', () => setTimeout(() => $$('.slide img', hero).forEach((i) => { i.loading = 'eager'; }), 1200));

  // ── New In ──────────────────────────────────────────────
  const novos = PRODUTOS.filter((p) => p.novo).slice(0, 4);
  $('[data-new-in]').innerHTML = novos.map(card).join('');

  // ── Instagram: 6 fotos (como no layout de referência) ──
  const fotos = [9, 8, 1, 11, 12, 13].map((n) => `assets/img/instagram/ig-${n}.jpg`);
  $('[data-insta]').innerHTML = fotos.map((f) => `
    <a href="${CFG.instagram}" target="_blank" rel="noopener" aria-label="Ver no Instagram">
      <img src="${f}" alt="" loading="lazy">${I.instagram}
    </a>`).join('');

  $('[data-vip]').href = CFG.grupoVip;
  revelar();
})();
