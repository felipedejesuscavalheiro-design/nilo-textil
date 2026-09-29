/* CAVELLE — Checkout
   Coleta dados, calcula frete/descontos (regras.js) e registra o pedido.
   Com o servidor (server.js) no ar, o pedido é salvo em /api/pedidos.
   Em hospedagem estática, o pedido segue direto pelo WhatsApp. */
(function () {
  'use strict';
  const { $, $$, CFG, I, esc, moeda, pctPix, lerSacola, gravarSacola, resumoPedido, calcularFrete, mascaraCep, htmlItem, linkWhats, guardado, parcela } = window.CV;

  const raiz = $('[data-checkout]');
  const itens = lerSacola();

  if (!itens.length) {
    raiz.innerHTML = `<div class="lista-vazia"><p>Sua sacola está vazia.</p><a class="btn" href="shop.html">Ir para o shop ${I.seta}</a></div>`;
    return;
  }

  const salvo = guardado.ler('cavelle_cliente', {});

  raiz.innerHTML = `
    <form class="checkout" novalidate data-form>
      <div>
        <section class="etapa">
          <h2><i>1</i> Seus dados</h2>
          <div class="campos">
            <label>Nome completo<input class="campo" name="nome" autocomplete="name" required></label>
            <label class="c3">E-mail<input class="campo" name="email" type="email" autocomplete="email" required></label>
            <label class="c3">WhatsApp<input class="campo" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" required></label>
            <label class="c3">CPF<input class="campo" name="cpf" inputmode="numeric" placeholder="000.000.000-00" required></label>
          </div>
        </section>

        <section class="etapa">
          <h2><i>2</i> Entrega</h2>
          <div class="campos">
            <label class="c2">CEP<input class="campo" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" required></label>
            <label class="c4" style="justify-content:flex-end"><a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener" style="text-transform:none;letter-spacing:.02em;text-decoration:underline;padding-bottom:13px">Não sei meu CEP</a></label>
            <label class="c4">Endereço<input class="campo" name="rua" autocomplete="address-line1" required></label>
            <label class="c2 c-meia">Número<input class="campo" name="numero" required></label>
            <label class="c3 c-meia">Complemento<input class="campo" name="complemento" autocomplete="address-line2"></label>
            <label class="c3">Bairro<input class="campo" name="bairro" required></label>
            <label class="c4">Cidade<input class="campo" name="cidade" autocomplete="address-level2" required></label>
            <label class="c2 c-meia">UF<input class="campo" name="uf" maxlength="2" autocomplete="address-level1" required></label>
          </div>
          <div class="opcoes" data-fretes style="margin-top:18px"></div>
        </section>

        <section class="etapa">
          <h2><i>3</i> Pagamento</h2>
          <div class="opcoes">
            <label><input type="radio" name="pagamento" value="pix" checked>
              <span class="op-txt">Pix <small data-pix-sub>${pctPix}% de desconto · aprovação imediata</small></span>
              <span class="op-valor" data-valor-pix></span></label>
            <label><input type="radio" name="pagamento" value="cartao">
              <span class="op-txt">Cartão de crédito <small>Em até ${CFG.parcelasSemJuros}x sem juros</small></span>
              <span class="op-valor" data-valor-cartao></span></label>
          </div>
          <div class="cupom-bloco">
            <p class="escolha__rotulo" style="margin-bottom:10px"><span><b>Cupom de desconto</b></span></p>
            <div class="cupom"><input class="campo" name="cupom" placeholder="Digite seu cupom" aria-label="Cupom de desconto" autocomplete="off"><button type="button" class="btn btn--linha" data-aplicar>Aplicar</button></div>
            <p class="aviso-estoque" data-cupom-msg></p>
            <p class="nota-descontos">Os descontos não são cumulativos. Se você usar um cupom, ele não se soma aos ${pctPix}% do Pix: vale sempre o maior desconto.</p>
          </div>
          <p class="texto-suave" style="font-size:12px;margin-top:14px">Após finalizar, nossa equipe confirma seu pedido pelo WhatsApp e envia a chave Pix ou o link de pagamento seguro do cartão.</p>
        </section>
      </div>

      <aside class="resumo-pedido">
        <h2>Resumo do pedido</h2>
        <div data-itens></div>
        <div class="resumo-linhas" data-totais></div>
        <button class="btn btn--bloco" type="submit" style="margin-top:20px;min-height:54px" data-finalizar>Finalizar pedido ${I.seta}</button>
        <p class="aviso-estoque aviso-erro" data-erro style="text-align:center"></p>
        <p class="seguro">${I.cadeado} Seus dados estão protegidos</p>
      </aside>
    </form>`;

  const f = $('[data-form]');
  ['nome', 'email', 'telefone', 'cpf', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf'].forEach((k) => { if (salvo[k]) f[k].value = salvo[k]; });
  if (!f.cep.value) f.cep.value = guardado.ler('cavelle_cep', '');

  const estado = { frete: 'economico', cupom: '' };
  const opcoes = () => ({ cep: f.cep.value, frete: estado.frete, pagamento: f.pagamento.value, cupom: estado.cupom });

  // ── Máscaras ──────────────────────────────────────────
  const soNum = (v) => v.replace(/\D/g, '');
  f.telefone.addEventListener('input', () => {
    const d = soNum(f.telefone.value).slice(0, 11);
    f.telefone.value = d.length > 10 ? d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3') : d.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, '($1) $2-$3').replace(/[-\s(]+$/, '');
  });
  f.cpf.addEventListener('input', () => {
    f.cpf.value = soNum(f.cpf.value).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  });
  f.uf.addEventListener('input', () => { f.uf.value = f.uf.value.toUpperCase().replace(/[^A-Z]/g, ''); });
  f.cep.addEventListener('input', () => {
    f.cep.value = mascaraCep(f.cep.value);
    if (soNum(f.cep.value).length === 8) buscarCep();
    atualizar();
  });

  // Preenche o endereço pelo CEP (ViaCEP); se falhar, a cliente digita
  let ultimoCep = '';
  async function buscarCep() {
    const cep = soNum(f.cep.value);
    if (cep === ultimoCep) return;
    ultimoCep = cep;
    guardado.gravar('cavelle_cep', f.cep.value);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) return;
      if (d.logradouro) f.rua.value = d.logradouro;
      if (d.bairro) f.bairro.value = d.bairro;
      f.cidade.value = d.localidade || f.cidade.value;
      f.uf.value = d.uf || f.uf.value;
      (d.logradouro ? f.numero : f.rua).focus();
    } catch (e) { /* sem conexão com o ViaCEP */ }
  }

  // ── Validação ─────────────────────────────────────────
  function cpfValido(v) {
    const c = soNum(v);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    const dig = (n) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
      const r = (s * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return dig(9) === Number(c[9]) && dig(10) === Number(c[10]);
  }
  const regras = {
    nome: (v) => v.trim().split(/\s+/).length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    telefone: (v) => soNum(v).length >= 10,
    cpf: cpfValido,
    cep: (v) => soNum(v).length === 8,
    rua: (v) => v.trim().length > 2,
    numero: (v) => v.trim().length > 0,
    bairro: (v) => v.trim().length > 1,
    cidade: (v) => v.trim().length > 1,
    uf: (v) => /^[A-Z]{2}$/.test(v),
  };
  const nomesCampos = { nome: 'nome e sobrenome', email: 'e-mail', telefone: 'WhatsApp', cpf: 'CPF', cep: 'CEP', rua: 'endereço', numero: 'número', bairro: 'bairro', cidade: 'cidade', uf: 'UF' };
  Object.keys(regras).forEach((k) => f[k].addEventListener('blur', () => { if (f[k].value) f[k].classList.toggle('invalido', !regras[k](f[k].value)); }));

  // ── Resumo ────────────────────────────────────────────
  function atualizar() {
    const r = resumoPedido(itens, opcoes());
    $('[data-itens]').innerHTML = itens.map((i, k) => htmlItem(i, k, false)).join('');

    const fr = calcularFrete(f.cep.value, r.subtotal);
    $('[data-fretes]').innerHTML = fr ? fr.opcoes.map((o) => `
      <label><input type="radio" name="frete" value="${o.id}" ${o.id === estado.frete ? 'checked' : ''}>
        <span class="op-txt">${o.nome} <small>${o.prazo} · ${fr.regiao}</small></span>
        <span class="op-valor">${o.valor ? moeda(o.valor) : 'Grátis'}</span></label>`).join('')
      : '<p class="texto-suave" style="font-size:12.5px">Informe o CEP para ver as opções de entrega.</p>';

    const rPix = resumoPedido(itens, { ...opcoes(), pagamento: 'pix' });
    const rCartao = resumoPedido(itens, { ...opcoes(), pagamento: 'cartao' });
    $('[data-valor-pix]').textContent = moeda(rPix.total);
    $('[data-pix-sub]').textContent = rPix.cupom && rPix.cupom.aplicado
      ? `Cupom aplicado no lugar dos ${pctPix}% · aprovação imediata`
      : `${pctPix}% de desconto · aprovação imediata`;
    $('[data-valor-cartao]').textContent = `${CFG.parcelasSemJuros}x ${moeda(parcela(rCartao.total))}`;

    const falta = CFG.freteGratisAcima - r.subtotal;
    $('[data-totais]').innerHTML = `
      <div class="resumo-linha"><span>Subtotal (${r.pecas} ${r.pecas === 1 ? 'peça' : 'peças'})</span><span>${moeda(r.subtotal)}</span></div>
      ${r.cupom && r.cupom.aplicado ? `<div class="resumo-linha"><span>Cupom ${esc(r.cupom.codigo)} (${Math.round(r.cupom.percentual * 100)}%)</span><span>− ${moeda(r.cupom.desconto)}</span></div>` : ''}
      ${r.descontoPix ? `<div class="resumo-linha"><span>Desconto Pix (${pctPix}%)</span><span>− ${moeda(r.descontoPix)}</span></div>` : ''}
      <div class="resumo-linha"><span>Frete</span><span>${r.frete ? (r.frete.valor ? moeda(r.frete.valor) : 'Grátis') : 'Informe o CEP'}</span></div>
      ${falta > 0 ? `<p class="texto-suave" style="font-size:11.5px;margin:4px 0">Faltam ${moeda(falta)} para frete grátis.</p>` : ''}
      <div class="resumo-linha resumo-linha--total"><span>Total</span><span>${moeda(r.total)}</span></div>
      ${f.pagamento.value === 'cartao' ? `<p class="texto-suave" style="font-size:12px;text-align:right">${CFG.parcelasSemJuros}x de ${moeda(parcela(r.total))} sem juros</p>` : ''}`;
    return r;
  }
  f.addEventListener('change', (e) => {
    if (e.target.name === 'frete') estado.frete = e.target.value;
    atualizar();
  });
  function mensagemCupom() {
    const msg = $('[data-cupom-msg]');
    if (!estado.cupom) { msg.textContent = ''; return; }
    const r = resumoPedido(itens, opcoes());
    if (!r.cupom) { msg.textContent = 'Cupom inválido ou expirado.'; msg.classList.add('aviso-erro'); return; }
    msg.classList.remove('aviso-erro');
    const pct = Math.round(r.cupom.percentual * 100);
    msg.textContent = r.cupom.aplicado
      ? `Cupom ${r.cupom.codigo} aplicado: ${pct}% off.`
      : `Cupom ${r.cupom.codigo} válido (${pct}%), mas o desconto do Pix é maior e foi mantido.`;
  }
  $('[data-aplicar]').addEventListener('click', () => {
    estado.cupom = f.cupom.value.trim();
    const r = resumoPedido(itens, opcoes());
    if (!r.cupom) {
      $('[data-cupom-msg]').textContent = 'Cupom inválido ou expirado.';
      $('[data-cupom-msg]').classList.add('aviso-erro');
      estado.cupom = '';
    } else {
      mensagemCupom();
    }
    atualizar();
  });
  f.cupom.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('[data-aplicar]').click(); } });
  f.addEventListener('change', (e) => { if (e.target.name === 'pagamento') mensagemCupom(); });
  const inicial = atualizar();
  window.CV.evento('begin_checkout', { value: inicial.subtotal });
  if (soNum(f.cep.value).length === 8 && !f.rua.value) buscarCep();

  // ── Finalizar ─────────────────────────────────────────
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erro = $('[data-erro]');
    const invalidos = Object.keys(regras).filter((k) => !regras[k](f[k].value));
    Object.keys(regras).forEach((k) => f[k].classList.toggle('invalido', invalidos.includes(k)));
    if (invalidos.length) {
      erro.textContent = `Confira: ${invalidos.map((k) => nomesCampos[k]).join(', ')}.`;
      f[invalidos[0]].focus();
      return;
    }
    const r = atualizar();
    if (r.erros.length) { erro.textContent = r.erros.join(' · '); return; }
    erro.textContent = '';

    const cliente = {};
    ['nome', 'email', 'telefone', 'cpf', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf'].forEach((k) => { cliente[k] = f[k].value.trim(); });
    guardado.gravar('cavelle_cliente', cliente);

    const btn = $('[data-finalizar]');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    const corpo = { itens, cliente, frete: estado.frete, pagamento: f.pagamento.value, cupom: estado.cupom };
    let pedido = null;
    try {
      const resp = await fetch('api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
      if (resp.ok) pedido = await resp.json();
      else if (resp.status === 400 || resp.status === 409) {
        const d = await resp.json().catch(() => ({}));
        erro.textContent = d.erro || 'Não foi possível concluir. Revise o pedido.';
        btn.disabled = false; btn.innerHTML = `Finalizar pedido ${I.seta}`;
        return;
      }
    } catch (err) { /* site sem servidor: segue pelo WhatsApp */ }

    if (!pedido) {
      pedido = { numero: `CV${Date.now().toString().slice(-7)}`, criadoEm: new Date().toISOString(), status: 'aguardando_pagamento', ...r, cliente, pagamento: f.pagamento.value, local: true };
    }
    const meus = guardado.ler('cavelle_pedidos', []);
    guardado.gravar('cavelle_pedidos', [{ numero: pedido.numero, email: cliente.email, total: pedido.total, criadoEm: pedido.criadoEm, local: !!pedido.local }, ...meus].slice(0, 20));
    gravarSacola([]);
    window.CV.evento('purchase', { transaction_id: pedido.numero, value: pedido.total, shipping: pedido.frete ? pedido.frete.valor : 0 });
    confirmar(pedido, cliente, f.pagamento.value);
  });

  function mensagemWhats(p, c, pag) {
    const linhas = p.linhas.map((l) => `• ${l.qtd}x ${l.nome} — ${l.cor} / ${l.tam} — ${moeda(l.total)}`).join('\n');
    return [
      `Olá, CAVELLE! Acabei de fazer o pedido *${p.numero}* pelo site.`,
      '',
      linhas,
      '',
      `Subtotal: ${moeda(p.subtotal)}`,
      p.cupom && p.cupom.aplicado ? `Cupom ${p.cupom.codigo}: −${moeda(p.cupom.desconto)}` : null,
      p.descontoPix ? `Desconto Pix: −${moeda(p.descontoPix)}` : null,
      `Frete (${p.frete.nome}): ${p.frete.valor ? moeda(p.frete.valor) : 'Grátis'}`,
      `*Total: ${moeda(p.total)}* — ${pag === 'pix' ? 'Pix' : `Cartão em ${CFG.parcelasSemJuros}x de ${moeda(parcela(p.total))}`}`,
      '',
      `Nome: ${c.nome}`,
      `Entrega: ${c.rua}, ${c.numero}${c.complemento ? ` — ${c.complemento}` : ''}, ${c.bairro}, ${c.cidade}/${c.uf}, CEP ${c.cep}`,
    ].filter((l) => l !== null).join('\n');
  }

  function confirmar(p, c, pag) {
    $('[data-cabeca]').hidden = true;
    const link = linkWhats(mensagemWhats(p, c, pag));
    raiz.innerHTML = `
      <section class="confirmacao">
        <p class="sobretitulo">Pedido recebido</p>
        <h1 class="titulo-display">Obrigada, ${esc(c.nome.split(' ')[0])}!</h1>
        <p>Recebemos o seu pedido. Para concluir, envie o resumo pelo WhatsApp: nossa equipe confirma e envia ${pag === 'pix' ? 'a chave Pix' : 'o link de pagamento seguro do cartão'}.</p>
        <span class="numero">Pedido ${esc(p.numero)} · ${moeda(p.total)}</span>
        <div>
          <a class="btn" href="${link}" target="_blank" rel="noopener">Enviar pelo WhatsApp ${I.seta}</a>
          <a class="btn btn--linha" href="shop.html">Continuar comprando</a>
        </div>
        <p class="texto-suave" style="font-size:12.5px;margin-top:26px">Atendimento: ${CFG.horario.toLowerCase()} · ${CFG.whatsappExibicao} · ${CFG.email}</p>
      </section>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
})();
