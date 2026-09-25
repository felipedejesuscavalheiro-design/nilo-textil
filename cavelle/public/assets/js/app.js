/* ============================================================
   CAVELLE — núcleo do site
   Cabeçalho, rodapé, sacola, busca, favoritos, modais e utilidades.
   Depende de config.js e produtos.js (carregados antes).
   ============================================================ */
(function () {
  'use strict';

  const CFG = window.CAVELLE_CONFIG;
  const PRODUTOS = window.CAVELLE_PRODUTOS;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // ── Armazenamento seguro (navegação privada pode bloquear) ──
  const guardado = {
    ler(chave, padrao) {
      try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
    },
  };

  // ── Dinheiro e regras comerciais (ver regras.js) ──
  const { centavos, reais, pctPix, precoPix, parcela, calcularFrete, resumoPedido } = window.CAVELLE_REGRAS;
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const moeda = (v) => fmt.format(v).replace(/\s/g, ' ');

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const param = (nome) => new URLSearchParams(location.search).get(nome);

  const linkWhats = (texto) => `https://wa.me/${CFG.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;

  // ── Produtos ──
  const produto = (id) => PRODUTOS.find((p) => p.id === id);
  const estoqueTotal = (p) => p.cores.reduce((s, c) => s + Object.values(c.estoque).reduce((a, b) => a + b, 0), 0);
  const nomeCategoria = (id) => (CFG.categorias.find((c) => c.id === id) || {}).nome || '';

  // ── Ícones (traço fino, minimalistas) ──
  const I = {
    busca: '<svg class="icone" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/></svg>',
    conta: '<svg class="icone" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/></svg>',
    sacola: '<svg class="icone" viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/></svg>',
    menu: '<svg class="icone" viewBox="0 0 24 24"><path d="M3.5 7h17M3.5 12h17M3.5 17h17"/></svg>',
    fechar: '<svg class="icone" viewBox="0 0 24 24"><path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>',
    coracao: '<svg class="icone icone--p" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0112 7.6a4.2 4.2 0 017.5 2.3C19.5 15.4 12 20 12 20z"/></svg>',
    seta: '<svg class="icone icone--p seta" viewBox="0 0 24 24"><path d="M4 12h15M14 7l5 5-5 5"/></svg>',
    esq: '<svg class="icone" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    dir: '<svg class="icone" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    cartao: '<svg class="icone" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 10h18M7 15h4"/></svg>',
    pix: '<svg class="icone" viewBox="0 0 24 24"><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12 12 3.5z"/><path d="M8.5 12h7"/></svg>',
    caixa: '<svg class="icone" viewBox="0 0 24 24"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>',
    cadeado: '<svg class="icone icone--p" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg>',
    email: '<svg class="icone" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/></svg>',
    relogio: '<svg class="icone" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    trocas: '<svg class="icone" viewBox="0 0 24 24"><path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/></svg>',
    instagram: '<svg class="icone" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  };

  // ============================================================
  // CABEÇALHO
  // ============================================================
  function paginaAtual() {
    const arq = location.pathname.split('/').pop() || 'index.html';
    const c = param('c');
    if (arq === 'index.html' || arq === '') return 'inicio';
    if (arq === 'shop.html') return c === 'new' ? 'new' : c === 'sale' ? 'sale' : c === 'acessorios' ? 'acessorios' : 'shop';
    if (arq === 'quem-somos.html') return 'sobre';
    if (arq === 'suporte.html') return 'suporte';
    return '';
  }

  function montarCabecalho() {
    const el = $('#cabecalho');
    if (!el) return;
    const at = paginaAtual();
    const ativo = (k) => (at === k ? ' ativo' : '');
    const cats = CFG.categorias.map((c) => `<li><a href="shop.html?c=${c.id}">${c.nome}</a></li>`).join('');

    el.className = 'cabecalho';
    el.innerHTML = `
      <div class="faixa" role="region" aria-label="Condições da loja">
        <div class="faixa__lista">
          <span class="faixa__item ativo">Frete grátis acima de R$${CFG.freteGratisAcima}</span><i class="faixa__sep"></i>
          <span class="faixa__item">${pctPix}% off no Pix</span><i class="faixa__sep"></i>
          <span class="faixa__item">Parcele em até ${CFG.parcelasSemJuros}x sem juros</span>
        </div>
      </div>
      <div class="barra">
        <div class="container barra__topo">
          <div class="barra__esq">
            <button class="icone-btn so-mobile" data-abrir="menu" aria-label="Abrir menu">${I.menu}</button>
            <button class="icone-btn" data-abrir="busca" aria-label="Buscar">${I.busca}</button>
          </div>
          <a class="logo" href="index.html" aria-label="CAVELLE — página inicial">CAVELLE</a>
          <div class="barra__dir">
            <a class="icone-btn" href="conta.html" aria-label="Minha conta">${I.conta}</a>
            <button class="icone-btn" data-abrir="sacola" aria-label="Abrir sacola">${I.sacola}<span class="contador" data-contador></span></button>
          </div>
        </div>
        <nav class="menu so-desktop" aria-label="Menu principal">
          <div class="menu__item"><a class="menu__link${ativo('inicio')}" href="index.html">Início</a></div>
          <div class="menu__item"><a class="menu__link${ativo('new')}" href="shop.html?c=new">New In</a></div>
          <div class="menu__item menu__item--mega">
            <a class="menu__link${ativo('shop')}" href="shop.html" aria-haspopup="true">Shop</a>
            <div class="mega">
              <div class="mega__grade">
                <div>
                  <p class="sobretitulo mega__titulo">Categorias</p>
                  <ul class="mega__lista">${cats}<li style="margin-top:22px"><a class="todos" href="shop.html">Todos os produtos →</a></li></ul>
                </div>
                <a class="mega__card" href="shop.html?c=new"><img src="assets/img/lifestyle/lifestyle-2.jpg" alt="" loading="lazy" style="object-position:50% 30%"><span>New In</span></a>
                <a class="mega__card" href="shop.html?c=acessorios"><img src="assets/img/categorias/acessorios.jpg" alt="" loading="lazy"><span>Acessórios</span></a>
              </div>
            </div>
          </div>
          <div class="menu__item"><a class="menu__link${ativo('acessorios')}" href="shop.html?c=acessorios">Acessórios</a></div>
          <div class="menu__item"><a class="menu__link${ativo('sale')}" href="shop.html?c=sale">Sale</a></div>
          <div class="menu__item"><a class="menu__link${ativo('sobre')}" href="quem-somos.html">Quem Somos</a></div>
          <div class="menu__item"><a class="menu__link${ativo('suporte')}" href="${linkWhats('Olá! Vim pelo site da CAVELLE e preciso de ajuda.')}" target="_blank" rel="noopener">Suporte</a></div>
        </nav>
      </div>`;

    // Menu mobile
    document.body.insertAdjacentHTML('beforeend', `
      <div class="gaveta-menu" id="gaveta-menu" aria-hidden="true">
        <div class="veu" data-fechar></div>
        <aside class="gaveta-menu__painel" role="dialog" aria-label="Menu">
          <div class="gaveta-menu__topo">
            <span class="logo" style="font-size:20px">CAVELLE</span>
            <button class="icone-btn" data-fechar aria-label="Fechar menu">${I.fechar}</button>
          </div>
          <ul class="gaveta-menu__nav">
            <li><a href="index.html">Início</a></li>
            <li><a href="shop.html?c=new">New In</a></li>
            <li><details><summary>Shop <span class="mais">+</span></summary>
              <div class="gaveta-menu__sub">${CFG.categorias.map((c) => `<a href="shop.html?c=${c.id}">${c.nome}</a>`).join('')}<a href="shop.html"><b style="font-weight:500">Todos os produtos</b></a></div>
            </details></li>
            <li><a href="shop.html?c=acessorios">Acessórios</a></li>
            <li><a href="shop.html?c=sale">Sale</a></li>
            <li><a href="quem-somos.html">Quem Somos</a></li>
            <li><a href="${linkWhats('Olá! Vim pelo site da CAVELLE e preciso de ajuda.')}" target="_blank" rel="noopener">Suporte</a></li>
          </ul>
          <div class="gaveta-menu__rodape">
            <a href="conta.html">${I.conta} Minha conta</a>
            <a href="${CFG.instagram}" target="_blank" rel="noopener">${I.instagram} ${CFG.instagramUsuario}</a>
            <a href="${CFG.grupoVip}" target="_blank" rel="noopener"><svg class="icone" viewBox="0 0 24 24" style="fill:currentColor;stroke:none">${I.whatsapp.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg> Grupo VIP</a>
          </div>
        </aside>
      </div>`);

    // Faixa: no celular mostra uma frase por vez
    const itens = $$('.faixa__item', el);
    let f = 0;
    setInterval(() => {
      itens[f].classList.remove('ativo');
      f = (f + 1) % itens.length;
      itens[f].classList.add('ativo');
    }, 3800);

    // Sombra ao rolar
    const aoRolar = () => el.classList.toggle('rolou', window.scrollY > 10);
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }

  // ============================================================
  // RODAPÉ + WHATSAPP FIXO
  // ============================================================
  function montarRodape() {
    const el = $('#rodape');
    if (!el) return;
    el.className = 'rodape';
    const col = (titulo, itens) => `
      <details class="rodape__col" open>
        <summary>${titulo} <span class="mais">+</span></summary>
        <ul>${itens}</ul>
      </details>`;
    const doc = [CFG.razaoSocial, CFG.documento].filter(Boolean).join(' · ');
    el.innerHTML = `
      <div class="container">
        <div class="rodape__grade">
          <div class="rodape__marca">
            <a class="logo" href="index.html">CAVELLE</a>
            <p>${CFG.slogan}</p>
            <div class="redes">
              <a href="${CFG.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${I.instagram}</a>
              <a href="${linkWhats()}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" style="fill:currentColor">${I.whatsapp.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></a>
            </div>
          </div>
          ${col('Navegação', `
            <li><a href="index.html">Início</a></li>
            <li><a href="shop.html?c=new">New In</a></li>
            <li><a href="shop.html">Shop</a></li>
            <li><a href="shop.html?c=acessorios">Acessórios</a></li>
            <li><a href="shop.html?c=sale">Sale</a></li>
            <li><a href="quem-somos.html">Quem Somos</a></li>`)}
          ${col('Atendimento', `
            <li><a href="${linkWhats()}" target="_blank" rel="noopener">WhatsApp</a></li>
            <li><a href="mailto:${CFG.email}">E-mail</a></li>
            <li><a href="suporte.html">Horário de atendimento</a></li>
            <li><a href="conta.html">Meus pedidos</a></li>`)}
          ${col('Ajuda', `
            <li><a href="politica-de-troca.html">Política de Troca</a></li>
            <li><a href="privacidade.html">Política de Privacidade</a></li>
            <li><a href="termos.html">Termos e Condições</a></li>
            <li><a href="formas-de-pagamento.html">Formas de Pagamento</a></li>
            <li><a href="envio.html">Envio e Entrega</a></li>`)}
          ${col('Contato', `
            <li><a href="${linkWhats()}" target="_blank" rel="noopener">${CFG.whatsappExibicao}</a></li>
            <li>${CFG.horario}</li>
            <li><a href="mailto:${CFG.email}">${CFG.email}</a></li>`)}
        </div>
        <div class="rodape__base">
          <span>© ${new Date().getFullYear()} CAVELLE. Todos os direitos reservados.${doc ? ` ${esc(doc)}` : ''}</span>
          <div class="pagamentos" aria-label="Formas de pagamento"><span>Pix</span><span>Visa</span><span>Mastercard</span><span>Elo</span><span>Amex</span></div>
        </div>
      </div>`;

    // No desktop as colunas ficam sempre abertas
    $$('.rodape__col summary', el).forEach((s) => s.addEventListener('click', (e) => { if (window.innerWidth > 900) e.preventDefault(); }));
    const ajustar = () => $$('.rodape__col', el).forEach((d) => { d.open = window.innerWidth > 900; });
    ajustar();
    let larg = window.innerWidth;
    window.addEventListener('resize', () => { if ((larg > 900) !== (window.innerWidth > 900)) ajustar(); larg = window.innerWidth; });

    document.body.insertAdjacentHTML('beforeend',
      `<a class="whats-fixo" href="${linkWhats('Olá! Vim pelo site da CAVELLE.')}" target="_blank" rel="noopener" aria-label="Falar com a CAVELLE no WhatsApp">${I.whatsapp}</a>
       <div class="aviso" role="status" aria-live="polite"></div>`);
  }

  // ============================================================
  // AVISO RÁPIDO
  // ============================================================
  let tAviso;
  function aviso(msg) {
    const el = $('.aviso');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visivel');
    clearTimeout(tAviso);
    tAviso = setTimeout(() => el.classList.remove('visivel'), 2600);
  }

  // ============================================================
  // PAINÉIS (abrir/fechar gavetas e modais)
  // ============================================================
  let ultimoFoco = null;
  function abrir(el) {
    if (!el) return;
    ultimoFoco = document.activeElement;
    el.classList.add(el.classList.contains('modal') ? 'aberto' : 'aberta');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('trava');
    const alvo = el.querySelector('input, button:not([data-fechar]), a, [data-fechar]');
    setTimeout(() => alvo && alvo.focus({ preventScroll: true }), 60);
  }
  function fechar(el) {
    if (!el) return;
    el.classList.remove('aberta', 'aberto');
    el.setAttribute('aria-hidden', 'true');
    if (!$('.aberta, .aberto')) document.body.classList.remove('trava');
    if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
  }
  function ligarPaineis() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-abrir]');
      if (a) {
        e.preventDefault();
        const alvo = a.dataset.abrir;
        if (alvo === 'menu') abrir($('#gaveta-menu'));
        if (alvo === 'busca') abrir($('#busca'));
        if (alvo === 'sacola') { renderSacola(); abrir($('#sacola')); }
        if (alvo === 'guia') abrir($('#modal-guia'));
        return;
      }
      const f = e.target.closest('[data-fechar]');
      if (f) fechar(f.closest('.gaveta-menu, .busca, .sacola, .modal'));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') $$('.aberta, .aberto').forEach(fechar);
    });
  }

  // ============================================================
  // FAVORITOS
  // ============================================================
  const favoritos = () => guardado.ler('cavelle_favoritos', []);
  function alternarFavorito(id) {
    let f = favoritos();
    const tem = f.includes(id);
    f = tem ? f.filter((x) => x !== id) : [...f, id];
    guardado.gravar('cavelle_favoritos', f);
    $$(`[data-fav="${id}"]`).forEach((b) => { b.classList.toggle('ativo', !tem); b.setAttribute('aria-pressed', String(!tem)); });
    aviso(tem ? 'Removido dos favoritos' : 'Salvo nos favoritos');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fav]');
    if (b) { e.preventDefault(); alternarFavorito(b.dataset.fav); }
  });

  // ============================================================
  // SACOLA
  // ============================================================
  const lerSacola = () => guardado.ler('cavelle_sacola', []).filter((i) => produto(i.id));
  const gravarSacola = (s) => { guardado.gravar('cavelle_sacola', s); atualizarContador(); };

  function estoqueDe(id, cor, tam) {
    const p = produto(id);
    const c = p && p.cores.find((x) => x.nome === cor);
    return c ? c.estoque[tam] || 0 : 0;
  }

  function adicionar(id, cor, tam, qtd = 1) {
    const s = lerSacola();
    const item = s.find((i) => i.id === id && i.cor === cor && i.tam === tam);
    const max = estoqueDe(id, cor, tam);
    const atual = item ? item.qtd : 0;
    if (atual + qtd > max) {
      aviso(max ? `Temos apenas ${max} ${max === 1 ? 'unidade' : 'unidades'} deste tamanho` : 'Tamanho esgotado');
      return false;
    }
    if (item) item.qtd += qtd; else s.push({ id, cor, tam, qtd });
    gravarSacola(s);
    renderSacola();
    abrir($('#sacola'));
    return true;
  }

  function totais(s = lerSacola()) {
    const sub = s.reduce((t, i) => t + centavos(produto(i.id).preco) * i.qtd, 0);
    const pecas = s.reduce((t, i) => t + i.qtd, 0);
    return {
      pecas,
      subtotal: reais(sub),
      pix: reais(Math.round((sub * (100 - pctPix)) / 100)),
      falta: Math.max(0, CFG.freteGratisAcima - reais(sub)),
    };
  }

  function atualizarContador() {
    const n = totais().pecas;
    $$('[data-contador]').forEach((c) => { c.textContent = n || ''; c.dataset.n = n; });
  }

  function montarSacola() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="sacola" id="sacola" aria-hidden="true">
        <div class="veu" data-fechar></div>
        <aside class="sacola__painel" role="dialog" aria-label="Sacola de compras">
          <div class="sacola__topo">
            <h2>Sacola <span data-sacola-n></span></h2>
            <button class="icone-btn" data-fechar aria-label="Fechar sacola">${I.fechar}</button>
          </div>
          <div data-sacola-corpo style="display:flex;flex-direction:column;flex:1;min-height:0"></div>
        </aside>
      </div>`);

    $('#sacola').addEventListener('click', (e) => {
      const b = e.target.closest('[data-acao]');
      if (!b) return;
      const s = lerSacola();
      const i = s[Number(b.dataset.i)];
      if (!i) return;
      if (b.dataset.acao === 'mais') {
        if (i.qtd + 1 > estoqueDe(i.id, i.cor, i.tam)) { aviso('Quantidade máxima em estoque'); return; }
        i.qtd += 1;
      }
      if (b.dataset.acao === 'menos') i.qtd -= 1;
      if (b.dataset.acao === 'remover' || i.qtd < 1) s.splice(Number(b.dataset.i), 1);
      gravarSacola(s);
      renderSacola();
    });
  }

  function htmlItem(i, idx, editavel = true) {
    const p = produto(i.id);
    const c = p.cores.find((x) => x.nome === i.cor) || p.cores[0];
    return `
      <div class="item-sacola">
        <a href="produto.html?id=${p.id}"><img src="${c.fotos[0]}" alt="${esc(p.nome)}" loading="lazy"></a>
        <div>
          <p class="item-sacola__nome">${esc(p.nome)}</p>
          <p class="item-sacola__var">${esc(i.cor)} · ${esc(i.tam)}${editavel ? '' : ` · ${i.qtd}x`}</p>
          <div class="item-sacola__linha">
            ${editavel ? `<div class="qtd"><button data-acao="menos" data-i="${idx}" aria-label="Diminuir">−</button><span>${i.qtd}</span><button data-acao="mais" data-i="${idx}" aria-label="Aumentar">+</button></div>` : '<span></span>'}
            <span class="item-sacola__preco">${moeda(p.preco * i.qtd)}</span>
          </div>
          ${editavel ? `<button class="item-sacola__remover" data-acao="remover" data-i="${idx}">Remover</button>` : ''}
        </div>
      </div>`;
  }

  function htmlFreteBarra(t) {
    const pct = Math.min(100, (t.subtotal / CFG.freteGratisAcima) * 100);
    const msg = t.falta > 0
      ? `Faltam <b style="font-weight:500">${moeda(t.falta)}</b> para você ganhar <b style="font-weight:500">frete grátis</b>.`
      : 'Parabéns! Você ganhou <b style="font-weight:500">frete grátis</b>.';
    return `<div class="frete-barra">${msg}<div class="frete-barra__trilho"><div class="frete-barra__cheio" style="width:${pct}%"></div></div></div>`;
  }

  function renderSacola() {
    const corpo = $('[data-sacola-corpo]');
    if (!corpo) return;
    const s = lerSacola();
    const t = totais(s);
    $('[data-sacola-n]').textContent = t.pecas ? `(${t.pecas})` : '';
    if (!s.length) {
      corpo.innerHTML = `
        <div class="sacola__vazia">
          <p>Sua sacola está vazia.</p>
          <a class="btn" href="shop.html?c=new">Ver novidades ${I.seta}</a>
        </div>`;
      return;
    }
    corpo.innerHTML = `
      ${htmlFreteBarra(t)}
      <div class="sacola__itens">${s.map((i, k) => htmlItem(i, k)).join('')}</div>
      <div class="sacola__rodape">
        <div class="resumo-linha"><span>Subtotal</span><span>${moeda(t.subtotal)}</span></div>
        <div class="resumo-linha texto-suave"><span>ou ${CFG.parcelasSemJuros}x de ${moeda(parcela(t.subtotal))} sem juros</span></div>
        <div class="resumo-linha resumo-linha--pix"><span>No Pix (${pctPix}% off)</span><span>${moeda(t.pix)}</span></div>
        <a class="btn btn--bloco" href="checkout.html">Finalizar compra ${I.seta}</a>
        <button class="sacola__continuar" data-fechar>Continuar comprando</button>
      </div>`;
  }

  // ============================================================
  // FRETE (regra por região do CEP — ver config.js e regras.js)
  // ============================================================
  const mascaraCep = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

  // ============================================================
  // BUSCA
  // ============================================================
  function montarBusca() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="busca" id="busca" aria-hidden="true">
        <div class="veu" data-fechar></div>
        <div class="busca__painel" role="dialog" aria-label="Buscar produtos">
          <div class="container">
            <form class="busca__campo" action="shop.html" role="search">
              ${I.busca}
              <input type="search" name="q" placeholder="O que você está buscando?" autocomplete="off" aria-label="Buscar">
              <button type="button" class="icone-btn" data-fechar aria-label="Fechar busca">${I.fechar}</button>
            </form>
            <div class="busca__sugestoes">
              ${CFG.categorias.map((c) => `<a href="shop.html?c=${c.id}">${c.nome}</a>`).join('')}
              <a href="shop.html?c=new">New In</a><a href="shop.html?c=sale">Sale</a>
            </div>
            <div data-busca-res></div>
          </div>
        </div>
      </div>`);
    const inp = $('#busca input');
    inp.addEventListener('input', () => {
      const q = inp.value.trim();
      const alvo = $('[data-busca-res]');
      if (q.length < 2) { alvo.innerHTML = ''; return; }
      const r = buscar(q).slice(0, 6);
      alvo.innerHTML = r.length
        ? `<div class="busca__resultados">${r.map((p) => `
            <a class="busca__res" href="produto.html?id=${p.id}">
              <img src="${p.cores[0].fotos[0]}" alt="" loading="lazy">
              <p>${esc(p.nome)}</p><span>${moeda(p.preco)}</span>
            </a>`).join('')}</div>`
        : `<p class="busca__vazio">Nenhum produto encontrado para “${esc(q)}”.</p>`;
    });
  }
  function buscar(q) {
    const termos = semAcento(q).split(/\s+/).filter(Boolean);
    return PRODUTOS.filter((p) => {
      const alvo = semAcento([p.nome, nomeCategoria(p.categoria), p.categoria, p.cores.map((c) => c.nome).join(' '), p.descricao].join(' '));
      return termos.every((t) => alvo.includes(t));
    });
  }

  // ============================================================
  // CARD DE PRODUTO
  // ============================================================
  function htmlPrecos(p, classe = '') {
    return `
      <p class="preco ${classe}">${p.precoDe ? `<s>${moeda(p.precoDe)}</s>` : ''}${moeda(p.preco)}</p>
      <p class="parcela">${CFG.parcelasSemJuros}x de ${moeda(parcela(p.preco))} sem juros</p>
      <p class="pix"><b>${moeda(precoPix(p.preco))}</b> no Pix (${pctPix}% off)</p>`;
  }

  function card(p) {
    const esgotado = estoqueTotal(p) === 0;
    const fav = favoritos().includes(p.id);
    const f = p.cores[0].fotos;
    const selo = esgotado ? '<span class="card__selo">Esgotado</span>'
      : p.precoDe ? `<span class="card__selo card__selo--escuro">-${Math.round((1 - p.preco / p.precoDe) * 100)}%</span>`
      : p.novo ? '<span class="card__selo">New In</span>' : '';
    // Tamanhos rápidos sobre a foto (desktop): usa a primeira cor com estoque
    const corRapida = p.cores.find((c) => Object.values(c.estoque).some((n) => n > 0)) || p.cores[0];
    const rapido = esgotado ? '' : `
          <div class="card__tamanhos">
            <p>${p.tamanhos.length > 1 ? `Adicionar à sacola · ${esc(corRapida.nome)}` : 'Adicionar à sacola'}</p>
            <div>${p.tamanhos.map((t) => `<button data-rapido="${p.id}" data-rapido-cor="${esc(corRapida.nome)}" data-rapido-tam="${esc(t)}" ${corRapida.estoque[t] ? '' : 'disabled'} aria-label="Adicionar ${esc(p.nome)} tamanho ${esc(t)}">${p.tamanhos.length > 1 ? esc(t) : '+ Adicionar'}</button>`).join('')}</div>
          </div>`;
    return `
      <article class="card${esgotado ? ' card--esgotado' : ''}">
        <div class="card__visual">
          <a class="card__midia" href="produto.html?id=${p.id}" aria-label="${esc(p.nome)}">
            <img src="${f[0]}" alt="${esc(p.nome)} ${esc(p.cores[0].nome)}" loading="lazy">
            ${f[1] ? `<img class="card__img2" src="${f[1]}" alt="" loading="lazy">` : ''}
          </a>${rapido}
        </div>
        ${selo}
        <button class="card__fav${fav ? ' ativo' : ''}" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Favoritar ${esc(p.nome)}">${I.coracao}</button>
        <div class="card__info">
          <a href="produto.html?id=${p.id}"><h3 class="card__nome">${esc(p.nome)}</h3></a>
          ${htmlPrecos(p)}
          ${p.cores.length > 1 || p.categoria !== 'acessorios' ? `<div class="cores" aria-label="Cores disponíveis">${p.cores.map((c) => `<span class="cor-bolinha" style="background:${c.hex}" title="${esc(c.nome)}"></span>`).join('')}</div>` : ''}
          <span class="card__spacer"></span>
          <button class="btn btn--bloco card__comprar" data-comprar="${p.id}" ${esgotado ? 'disabled' : ''}>${esgotado ? 'Esgotado' : 'Comprar'}</button>
        </div>
      </article>`;
  }

  // ============================================================
  // COMPRA RÁPIDA (escolher cor e tamanho sem sair da página)
  // ============================================================
  function montarModais() {
    const g = CFG.guiaTamanhos;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal" id="modal-guia" aria-hidden="true">
        <div class="veu" data-fechar></div>
        <div class="modal__caixa" role="dialog" aria-label="Guia de tamanhos">
          <button class="icone-btn modal__fechar" data-fechar aria-label="Fechar">${I.fechar}</button>
          <h3>Guia de tamanhos</h3>
          <p class="texto-suave" style="font-size:13px">Medidas do corpo, em centímetros. Se ficar entre dois tamanhos, prefira o maior para mais conforto ou o menor para mais compressão.</p>
          <table class="tabela"><thead><tr>${g.colunas.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${g.linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <p class="texto-suave" style="font-size:12px;margin-top:18px">Ficou em dúvida? <a href="${linkWhats('Olá! Quero ajuda para escolher meu tamanho.')}" target="_blank" rel="noopener" style="text-decoration:underline">Fale com a gente no WhatsApp</a>.</p>
        </div>
      </div>
      <div class="modal" id="modal-rapida" aria-hidden="true">
        <div class="veu" data-fechar></div>
        <div class="modal__caixa" role="dialog" aria-label="Escolha cor e tamanho">
          <button class="icone-btn modal__fechar" data-fechar aria-label="Fechar">${I.fechar}</button>
          <div data-rapida></div>
        </div>
      </div>`);

    document.addEventListener('click', (e) => {
      const r = e.target.closest('[data-rapido]');
      if (r) { e.preventDefault(); adicionar(r.dataset.rapido, r.dataset.rapidoCor, r.dataset.rapidoTam, 1); return; }
      const b = e.target.closest('[data-comprar]');
      if (!b) return;
      e.preventDefault();
      compraRapida(b.dataset.comprar);
    });
  }

  function seletor(p, estado, aoMudar) {
    // Monta cor + tamanho e devolve o HTML; eventos ligados por delegação
    const cor = p.cores.find((c) => c.nome === estado.cor);
    return `
      <div class="escolha">
        <p class="escolha__rotulo"><span><b>Cor</b><em>${esc(cor.nome)}</em></span></p>
        <div class="escolha__cores">${p.cores.map((c) => `<button class="cor-opcao${c.nome === estado.cor ? ' ativo' : ''}" data-cor="${esc(c.nome)}" aria-label="${esc(c.nome)}" aria-pressed="${c.nome === estado.cor}"><i style="background:${c.hex}"></i></button>`).join('')}</div>
      </div>
      <div class="escolha">
        <p class="escolha__rotulo"><span><b>Tamanho</b><em>${estado.tam ? esc(estado.tam) : ''}</em></span>${p.tamanhos.length > 1 ? '<button class="link-guia" data-abrir="guia">Guia de tamanhos</button>' : ''}</p>
        <div class="escolha__tamanhos">${p.tamanhos.map((t) => `<button class="tam${t === estado.tam ? ' ativo' : ''}" data-tam="${esc(t)}" ${cor.estoque[t] ? '' : 'disabled'} aria-pressed="${t === estado.tam}">${esc(t)}</button>`).join('')}</div>
        <p class="aviso-estoque" data-aviso-estoque>${estado.tam && cor.estoque[estado.tam] <= 2 ? `Últimas ${cor.estoque[estado.tam]} unidades` : ''}</p>
      </div>`;
  }

  function estadoInicial(p) {
    const cor = p.cores.find((c) => Object.values(c.estoque).some((n) => n > 0)) || p.cores[0];
    const unico = p.tamanhos.length === 1 ? p.tamanhos[0] : null;
    return { cor: cor.nome, tam: unico && cor.estoque[unico] ? unico : null };
  }

  function compraRapida(id) {
    const p = produto(id);
    if (!p) return;
    const est = estadoInicial(p);
    const alvo = $('[data-rapida]');
    const desenhar = () => {
      const cor = p.cores.find((c) => c.nome === est.cor);
      alvo.innerHTML = `
        <div class="rapida">
          <img src="${cor.fotos[0]}" alt="${esc(p.nome)}">
          <div>
            <h3>${esc(p.nome)}</h3>
            ${htmlPrecos(p)}
          </div>
        </div>
        ${seletor(p, est)}
        <button class="btn btn--bloco" data-rapida-add style="margin-top:22px;min-height:52px">Adicionar à sacola</button>
        <a class="link-seta" href="produto.html?id=${p.id}" style="margin-top:16px">Ver detalhes do produto ${I.seta}</a>`;
    };
    alvo.onclick = (e) => {
      const c = e.target.closest('[data-cor]');
      const t = e.target.closest('[data-tam]');
      if (c) { est.cor = c.dataset.cor; const cor = p.cores.find((x) => x.nome === est.cor); if (!cor.estoque[est.tam]) est.tam = p.tamanhos.length === 1 ? p.tamanhos[0] : null; desenhar(); }
      if (t) { est.tam = t.dataset.tam; desenhar(); }
      if (e.target.closest('[data-rapida-add]')) {
        if (!est.tam) { const a = $('[data-aviso-estoque]', alvo); a.textContent = 'Escolha um tamanho'; a.classList.add('aviso-erro'); return; }
        fechar($('#modal-rapida'));
        adicionar(p.id, est.cor, est.tam, 1);
      }
    };
    desenhar();
    abrir($('#modal-rapida'));
  }

  // ============================================================
  // REVELAR AO ROLAR
  // ============================================================
  function revelar(raiz = document) {
    const els = $$('.revelar:not(.visivel)', raiz);
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('visivel')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
  }

  // ============================================================
  // INICIAR
  // ============================================================
  montarCabecalho();
  montarRodape();
  montarBusca();
  montarSacola();
  montarModais();
  ligarPaineis();
  atualizarContador();
  renderSacola();
  revelar();
  window.addEventListener('storage', () => { atualizarContador(); renderSacola(); });

  // API pública para os scripts de cada página
  window.CV = {
    CFG, PRODUTOS, $, $$, I, esc, moeda, centavos, reais, precoPix, parcela, pctPix, param, semAcento,
    linkWhats, produto, estoqueTotal, nomeCategoria, card, htmlPrecos, htmlItem, htmlFreteBarra, seletor, estadoInicial,
    adicionar, lerSacola, gravarSacola, totais, renderSacola, calcularFrete, resumoPedido, mascaraCep, buscar,
    favoritos, guardado, aviso, abrir, fechar, revelar,
  };
})();
