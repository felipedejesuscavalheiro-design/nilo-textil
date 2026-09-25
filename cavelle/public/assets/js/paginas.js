/* CAVELLE — Páginas institucionais e Minha conta */
(function () {
  'use strict';
  const { $, $$, CFG, I, esc, moeda, linkWhats, favoritos, produto, card, guardado } = window.CV;

  // Contatos vindos do config.js (um lugar só para atualizar)
  const links = { whatsapp: linkWhats(), email: `mailto:${CFG.email}`, instagram: CFG.instagram, grupoVip: CFG.grupoVip };
  $$('[data-link]').forEach((a) => { if (links[a.dataset.link]) a.href = links[a.dataset.link]; });
  const doc = [CFG.razaoSocial, CFG.documento].filter(Boolean).join(', ');
  const textos = { ...CFG, documentoLinha: doc ? ` (${doc})` : '' };
  $$('[data-texto]').forEach((el) => { el.textContent = textos[el.dataset.texto] || ''; });

  // Tabela de frete (Envio e Entrega)
  const tab = $('[data-tabela-frete]');
  if (tab) {
    tab.innerHTML = `<thead><tr><th>Região</th><th>Econômico</th><th>Expresso</th></tr></thead><tbody>${
      Object.values(CFG.frete).map((r) => `<tr><td>${r.regiao}</td><td>${moeda(r.economico[0])}<br><small class="texto-suave">${r.economico[1]}</small></td><td>${moeda(r.expresso[0])}<br><small class="texto-suave">${r.expresso[1]}</small></td></tr>`).join('')
    }</tbody>`;
  }

  // ── Minha conta ─────────────────────────────────────────
  const favEl = $('[data-favoritos]');
  if (favEl) {
    const desenharFav = () => {
      const fav = favoritos().map(produto).filter(Boolean);
      favEl.innerHTML = fav.length ? fav.map(card).join('')
        : `<p class="texto-suave" style="grid-column:1/-1">Toque no ${I.coracao.replace('icone icone--p', 'icone icone--p" style="vertical-align:-3px')} dos produtos para salvar seus favoritos aqui.</p>`;
    };
    desenharFav();
    document.addEventListener('click', (e) => { if (e.target.closest('[data-fav]')) setTimeout(desenharFav, 50); });

    const nomesStatus = {
      aguardando_pagamento: 'Aguardando pagamento', pago: 'Pagamento aprovado', em_separacao: 'Em separação',
      enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
    };
    const meus = guardado.ler('cavelle_pedidos', []);
    $('[data-meus-pedidos]').innerHTML = meus.length ? meus.map((p) => `
      <div class="pedido-card">
        <header><b style="font-weight:500">Pedido ${esc(p.numero)}</b><span>${moeda(p.total)}</span></header>
        <span class="texto-suave">${new Date(p.criadoEm).toLocaleDateString('pt-BR')} · ${esc(p.email)}</span>
      </div>`).join('') : '<p class="texto-suave">Nenhum pedido feito neste aparelho ainda.</p>';

    const form = $('[data-rastrear]');
    const res = $('[data-rastreio-res]');
    if (meus[0]) { form.numero.value = meus[0].numero; form.email.value = meus[0].email; }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const numero = form.numero.value.trim().toUpperCase();
      const email = form.email.value.trim();
      res.innerHTML = '<p class="texto-suave" style="margin-top:16px">Buscando…</p>';
      try {
        const r = await fetch(`api/pedidos/${encodeURIComponent(numero)}?email=${encodeURIComponent(email)}`);
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('json')) throw new Error('sem servidor');
        const d = await r.json();
        if (!r.ok) { res.innerHTML = `<p class="aviso-erro" style="margin-top:16px">${esc(d.erro || 'Pedido não encontrado.')}</p>`; return; }
        res.innerHTML = `
          <div class="pedido-card" style="margin-top:20px">
            <header><b style="font-weight:500">Pedido ${esc(d.numero)}</b><span class="status">${nomesStatus[d.status] || d.status}</span></header>
            <p class="texto-suave">${new Date(d.criadoEm).toLocaleDateString('pt-BR')} · ${moeda(d.total)}</p>
            <ul style="margin-top:10px">${d.linhas.map((l) => `<li>${l.qtd}x ${esc(l.nome)} — ${esc(l.cor)} / ${esc(l.tam)}</li>`).join('')}</ul>
            ${d.rastreio ? `<p style="margin-top:10px">Rastreio: <a href="https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(d.rastreio)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(d.rastreio)}</a></p>` : ''}
          </div>`;
      } catch (err) {
        res.innerHTML = `<p style="margin-top:16px">Para acompanhar este pedido, <a href="${linkWhats(`Olá! Quero acompanhar o pedido ${numero}.`)}" target="_blank" rel="noopener" style="text-decoration:underline">fale com a gente no WhatsApp</a>.</p>`;
      }
    });
  }
})();
