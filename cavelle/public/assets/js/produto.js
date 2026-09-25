/* CAVELLE — Página de produto */
(function () {
  'use strict';
  const {
    $, $$, CFG, PRODUTOS, I, esc, moeda, precoPix, parcela, pctPix, param, produto, card, htmlPrecos,
    seletor, estadoInicial, adicionar, favoritos, calcularFrete, mascaraCep, nomeCategoria, linkWhats, guardado,
  } = window.CV;

  const raiz = $('[data-produto]');
  const p = produto(param('id'));

  if (!p) {
    raiz.innerHTML = `
      <div class="lista-vazia">
        <h1 class="titulo-display" style="font-size:40px;margin-bottom:14px">Produto não encontrado</h1>
        <p>Talvez ele tenha esgotado ou mudado de endereço.</p>
        <a class="btn" href="shop.html">Ver todos os produtos ${I.seta}</a>
      </div>`;
    return;
  }

  // ── SEO ────────────────────────────────────────────────
  document.title = `${p.nome} | CAVELLE`;
  const desc = `${p.nome} CAVELLE por ${moeda(p.preco)} ou ${moeda(precoPix(p.preco))} no Pix. ${p.descricao}`;
  $('meta[name="description"]').setAttribute('content', desc);
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nome,
    brand: { '@type': 'Brand', name: 'CAVELLE' },
    description: p.descricao,
    image: p.cores[0].fotos.map((f) => new URL(f, location.href).href),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: p.preco.toFixed(2),
      availability: 'https://schema.org/InStock',
      url: location.href,
    },
  });
  document.head.appendChild(ld);

  const est = estadoInicial(p);
  const corParam = param('cor');
  if (corParam && p.cores.some((c) => c.nome === corParam)) est.cor = corParam;
  let foto = 0;
  const cuidados = p.categoria === 'acessorios'
    ? 'Limpe com pano macio levemente umedecido e sabão neutro. Não lave na máquina. Seque à sombra.'
    : 'Lave à mão ou na máquina em ciclo delicado, com água fria e sabão neutro. Lave do avesso e separe por cor. Não use alvejante nem amaciante. Não passe a ferro. Seque à sombra.';

  raiz.innerHTML = `
    <div class="produto">
      <div class="galeria" data-galeria></div>
      <div class="info-produto">
        <p class="trilha"><a href="index.html">Início</a> / <a href="shop.html?c=${p.categoria}">${nomeCategoria(p.categoria)}</a> / ${esc(p.nome)}</p>
        <h1>${esc(p.nome)}</h1>
        ${htmlPrecos(p)}
        <div data-seletor></div>
        <div class="compra">
          <button class="btn" data-add>Comprar ${I.seta}</button>
          <button class="card__fav${favoritos().includes(p.id) ? ' ativo' : ''}" data-fav="${p.id}" aria-pressed="${favoritos().includes(p.id)}" aria-label="Favoritar">${I.coracao}</button>
        </div>
        <ul class="beneficios-produto">
          <li>${I.cartao}<div><strong>${CFG.parcelasSemJuros}x sem juros</strong><span>Parcele sua compra em até ${CFG.parcelasSemJuros}x de ${moeda(parcela(p.preco))} sem juros.</span></div></li>
          <li>${I.pix}<div><strong>${pctPix}% off no Pix</strong><span>${moeda(precoPix(p.preco))} no Pix.</span></div></li>
          <li>${I.caixa}<div><strong>Frete grátis</strong><span>Nas compras acima de R$${CFG.freteGratisAcima}.</span></div></li>
        </ul>
        <div class="frete-calc">
          <p class="escolha__rotulo"><span><b>Calcular frete</b></span></p>
          <form data-frete>
            <input class="campo" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="Digite seu CEP" aria-label="CEP" maxlength="9">
            <button class="btn btn--linha" type="submit">Calcular</button>
          </form>
          <div class="frete-res" data-frete-res></div>
        </div>
        <div class="sanfona">
          <details open><summary>Descrição <span class="mais">+</span></summary>
            <div class="sanfona__corpo"><p>${esc(p.descricao)}</p><ul>${p.detalhes.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
          </details>
          <details><summary>Composição e cuidados <span class="mais">+</span></summary>
            <div class="sanfona__corpo"><p><b style="font-weight:500">Composição:</b> ${esc(p.composicao)}</p><p style="margin-top:10px">${cuidados}</p></div>
          </details>
          <details><summary>Envio e trocas <span class="mais">+</span></summary>
            <div class="sanfona__corpo">
              <p>Enviamos para todo o Brasil a partir de São Paulo. Pedidos pagos até as 12h em dias úteis são postados no mesmo dia ou no dia útil seguinte.</p>
              <p style="margin-top:10px">Trocas por tamanho ou cor em até 7 dias após o recebimento. <a href="politica-de-troca.html" style="text-decoration:underline">Ver política de troca</a>.</p>
            </div>
          </details>
          <details><summary>Dúvidas <span class="mais">+</span></summary>
            <div class="sanfona__corpo"><p>Nossa equipe te ajuda a escolher o tamanho ideal. <a href="${linkWhats(`Olá! Tenho uma dúvida sobre o produto ${p.nome}.`)}" target="_blank" rel="noopener" style="text-decoration:underline">Fale com a gente no WhatsApp</a> — ${CFG.horario.toLowerCase()}.</p></div>
          </details>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="compra-fixa" data-compra-fixa>
      <div><b>${esc(p.nome)}</b>${moeda(p.preco)} · <span style="font-weight:500">${moeda(precoPix(p.preco))} no Pix</span></div>
      <button class="btn" data-add-fixo>Comprar</button>
    </div>`);
  document.body.classList.add('tem-compra-fixa');

  // ── Galeria ────────────────────────────────────────────
  const cor = () => p.cores.find((c) => c.nome === est.cor);
  function desenharGaleria() {
    const fotos = cor().fotos;
    if (foto >= fotos.length) foto = 0;
    $('[data-galeria]').innerHTML = `
      <div class="galeria__minis">${fotos.map((f, i) => `<button class="galeria__mini${i === foto ? ' ativo' : ''}" data-foto="${i}" aria-label="Foto ${i + 1}"><img src="${f}" alt=""></button>`).join('')}</div>
      <div class="galeria__principal" data-zoom><img src="${fotos[foto]}" alt="${esc(p.nome)} ${esc(est.cor)}"><span class="galeria__dica">Passe o mouse para ampliar</span></div>
      <div class="galeria__trilho" data-trilho>${fotos.map((f, i) => `<img src="${f}" alt="${esc(p.nome)} ${esc(est.cor)} — foto ${i + 1}"${i ? ' loading="lazy"' : ''}>`).join('')}</div>
      <div class="galeria__pontos so-mobile">${fotos.map((_, i) => `<i class="${i ? '' : 'ativo'}"></i>`).join('')}</div>`;
    const tr = $('[data-trilho]');
    tr.addEventListener('scroll', () => {
      const i = Math.round(tr.scrollLeft / tr.clientWidth);
      $$('.galeria__pontos i').forEach((el, k) => el.classList.toggle('ativo', k === i));
    }, { passive: true });
    const z = $('[data-zoom]');
    const img = $('img', z);
    z.addEventListener('mouseenter', () => z.classList.add('zoom'));
    z.addEventListener('mouseleave', () => z.classList.remove('zoom'));
    z.addEventListener('mousemove', (e) => {
      const r = z.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
  }
  $('[data-galeria]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-foto]');
    if (!b) return;
    foto = Number(b.dataset.foto);
    $$('.galeria__mini').forEach((m, i) => m.classList.toggle('ativo', i === foto));
    const img = $('[data-zoom] img');
    img.style.opacity = 0;
    setTimeout(() => { img.src = cor().fotos[foto]; img.style.opacity = 1; }, 180);
  });

  // ── Cor e tamanho ──────────────────────────────────────
  const sel = $('[data-seletor]');
  const desenharSeletor = () => { sel.innerHTML = seletor(p, est); };
  sel.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cor]');
    const t = e.target.closest('[data-tam]');
    if (c && c.dataset.cor !== est.cor) {
      est.cor = c.dataset.cor;
      if (!cor().estoque[est.tam]) est.tam = p.tamanhos.length === 1 ? p.tamanhos[0] : null;
      foto = 0;
      desenharSeletor();
      desenharGaleria();
      history.replaceState(null, '', `?id=${p.id}&cor=${encodeURIComponent(est.cor)}`);
    }
    if (t) { est.tam = t.dataset.tam; desenharSeletor(); }
  });

  function comprar() {
    if (!est.tam) {
      const a = $('[data-aviso-estoque]');
      a.textContent = 'Escolha um tamanho para continuar';
      a.classList.add('aviso-erro');
      sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    adicionar(p.id, est.cor, est.tam, 1);
  }
  $('[data-add]').addEventListener('click', comprar);
  $('[data-add-fixo]').addEventListener('click', comprar);

  // Barra fixa no celular aparece quando o botão principal sai da tela
  const barra = $('[data-compra-fixa]');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => barra.classList.toggle('visivel', !en.isIntersecting && en.boundingClientRect.top < 0))
      .observe($('[data-add]'));
  }

  // ── Frete ──────────────────────────────────────────────
  const fForm = $('[data-frete]');
  const cepSalvo = guardado.ler('cavelle_cep', '');
  fForm.cep.value = cepSalvo;
  fForm.cep.addEventListener('input', () => { fForm.cep.value = mascaraCep(fForm.cep.value); });
  fForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = calcularFrete(fForm.cep.value, p.preco);
    const alvo = $('[data-frete-res]');
    if (!r) { alvo.innerHTML = '<p class="aviso-erro">Digite um CEP válido com 8 números.</p>'; return; }
    guardado.gravar('cavelle_cep', fForm.cep.value);
    alvo.innerHTML = `<ul>${r.opcoes.map((o) => `<li><span>${o.nome} · ${o.prazo}</span><b style="font-weight:500">${o.valor ? moeda(o.valor) : 'Grátis'}</b></li>`).join('')}</ul>
      <p class="texto-suave" style="margin-top:8px;font-size:11.5px">Frete grátis nas compras acima de R$${CFG.freteGratisAcima}. <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener" style="text-decoration:underline">Não sei meu CEP</a></p>`;
  });

  desenharGaleria();
  desenharSeletor();

  // ── Relacionados ───────────────────────────────────────
  const rel = PRODUTOS.filter((x) => x.id !== p.id)
    .sort((a, b) => (a.categoria === p.categoria) - (b.categoria === p.categoria) || (!!b.novo - !!a.novo))
    .slice(0, 4);
  if (rel.length) {
    $('[data-relacionados]').innerHTML = rel.map(card).join('');
    $('[data-relacionados-sec]').hidden = false;
  }

  // Últimos vistos (usado na conta)
  const vistos = guardado.ler('cavelle_vistos', []).filter((x) => x !== p.id);
  guardado.gravar('cavelle_vistos', [p.id, ...vistos].slice(0, 8));
})();
