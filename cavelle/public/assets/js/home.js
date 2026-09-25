/* CAVELLE — Home: carrossel, New In e Instagram */
(function () {
  'use strict';
  const { $, $$, card, PRODUTOS, CFG, I, revelar } = window.CV;

  // ── Carrossel ───────────────────────────────────────────
  const hero = $('.hero');
  const slides = $$('.slide', hero);
  const pontos = $('.hero__pontos', hero);
  const atualEl = $('[data-hero-atual]', hero);
  let atual = 0;
  const TEMPO = 6500;
  hero.style.setProperty('--tempo', `${TEMPO}ms`);

  pontos.innerHTML = slides.map((_, i) => `<button class="hero__ponto${i ? '' : ' ativo'}" role="tab" aria-label="Banner ${i + 1}" aria-selected="${!i}"></button>`).join('');
  const botoes = $$('.hero__ponto', pontos);

  function ir(n) {
    const prox = (n + slides.length) % slides.length;
    if (prox === atual) return;
    slides[atual].classList.remove('ativo');
    botoes[atual].classList.remove('ativo');
    botoes[atual].setAttribute('aria-selected', 'false');
    atual = prox;
    const s = slides[atual];
    const img = $('img', s);
    if (img && img.loading === 'lazy') img.loading = 'eager';
    s.classList.add('ativo');
    botoes[atual].classList.add('ativo');
    botoes[atual].setAttribute('aria-selected', 'true');
    hero.dataset.tom = s.dataset.tom;
    atualEl.textContent = String(atual + 1).padStart(2, '0');
  }
  // O avanço automático segue a barra de tempo do ponto ativo (CSS):
  // quando ela termina, passa para o próximo. Pausar a barra pausa o carrossel.
  pontos.addEventListener('animationend', (e) => { if (e.target.classList.contains('ativo')) ir(atual + 1); });
  const parar = () => hero.classList.add('pausado');
  const iniciar = () => hero.classList.remove('pausado');

  botoes.forEach((b, i) => b.addEventListener('click', () => ir(i)));
  $('[data-hero="ant"]').addEventListener('click', () => ir(atual - 1));
  $('[data-hero="prox"]').addEventListener('click', () => ir(atual + 1));
  hero.addEventListener('focusin', parar);
  hero.addEventListener('focusout', iniciar);

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
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : iniciar()));

  // Pré-carrega os outros banners depois que a página abriu
  window.addEventListener('load', () => setTimeout(() => $$('.slide img', hero).forEach((i) => { i.loading = 'eager'; }), 1200));

  // ── New In ──────────────────────────────────────────────
  const novos = PRODUTOS.filter((p) => p.novo).slice(0, 4);
  $('[data-new-in]').innerHTML = novos.map(card).join('');

  // ── Instagram ──────────────────────────────────────────
  const fotos = [1, 2, 3, 4, 5, 6].map((n) => `assets/img/instagram/ig-${n}.jpg`);
  $('[data-insta]').innerHTML = `<div class="marquee__trilho">${fotos.map((f) => `
    <a href="${CFG.instagram}" target="_blank" rel="noopener" aria-label="Ver no Instagram">
      <img src="${f}" alt="" loading="lazy">${I.instagram}
    </a>`).join('')}</div>`;
  $('[data-insta]').setAttribute('data-marquee', '');

  $('[data-vip]').href = CFG.grupoVip;
  revelar();
})();
