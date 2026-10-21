/* ============================================================
   CAVELLE — Regras comerciais (compartilhado navegador + servidor)
   Preço no Pix, parcelas, frete e total do pedido.
   Todos os cálculos são feitos em centavos para evitar erro de
   arredondamento: R$279,90 × 0,95 = R$265,91.
   ============================================================ */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica;
  else root.CAVELLE_REGRAS = fabrica(root.CAVELLE_CONFIG, root.CAVELLE_PRODUTOS);
})(typeof self !== 'undefined' ? self : this, function (CFG, PRODUTOS) {
  const centavos = (v) => Math.round(v * 100);
  const reais = (c) => c / 100;
  const pctPix = Math.round(CFG.descontoPix * 100);

  // Preço × 0,95, arredondado ao centavo
  const precoPix = (v) => reais(Math.round((centavos(v) * (100 - pctPix)) / 100));
  const parcela = (v) => reais(Math.round(centavos(v) / CFG.parcelasSemJuros));

  function calcularFrete(cep, subtotal) {
    const d = String(cep || '').replace(/\D/g, '');
    if (d.length !== 8) return null;
    const r = CFG.frete[d[0]];
    if (!r) return null;
    const gratis = subtotal >= CFG.freteGratisAcima;
    return {
      regiao: r.regiao,
      opcoes: [
        { id: 'economico', nome: gratis ? 'Frete grátis' : 'Econômico', valor: gratis ? 0 : r.economico[0], prazo: r.economico[1] },
        { id: 'expresso', nome: 'Expresso', valor: r.expresso[0], prazo: r.expresso[1] },
      ],
    };
  }

  /**
   * Calcula o pedido completo a partir dos itens (id, cor, tam, qtd).
   * opcoes: { cep, frete: 'economico'|'expresso', pagamento: 'pix'|'cartao', cupom }
   */
  function resumoPedido(itens, opcoes = {}) {
    const erros = [];
    const linhas = [];
    let sub = 0;
    (itens || []).forEach((i) => {
      const p = PRODUTOS.find((x) => x.id === i.id);
      const cor = p && p.cores.find((c) => c.nome === i.cor);
      const qtd = Math.floor(Number(i.qtd));
      if (!p || !cor || !p.tamanhos.includes(i.tam) || !(qtd > 0)) { erros.push(`Item inválido: ${i.id}`); return; }
      const disp = cor.estoque[i.tam] || 0;
      if (qtd > disp) erros.push(`${p.nome} ${i.cor} ${i.tam}: apenas ${disp} em estoque`);
      const total = centavos(p.preco) * qtd;
      sub += total;
      linhas.push({ id: p.id, nome: p.nome, cor: i.cor, tam: i.tam, qtd, preco: p.preco, total: reais(total), foto: cor.fotos[0] });
    });
    if (!linhas.length) erros.push('Sacola vazia');

    // Descontos NÃO são cumulativos: entre o cupom e o desconto do Pix,
    // vale apenas o maior.
    const cupons = CFG.cupons || {};
    const codigo = String(opcoes.cupom || '').trim().toUpperCase();
    const pctCupom = codigo && cupons[codigo] ? cupons[codigo] : 0;
    if (codigo && !pctCupom) erros.push('Cupom inválido');
    const valorCupom = Math.round(sub * pctCupom);
    const valorPix = opcoes.pagamento === 'pix' ? sub - Math.round((sub * (100 - pctPix)) / 100) : 0;
    const usaCupom = valorCupom > 0 && valorCupom >= valorPix;
    const descCupom = usaCupom ? valorCupom : 0;
    const descPix = usaCupom ? 0 : valorPix;
    const base = sub - descCupom;

    let frete = null;
    if (opcoes.cep) {
      const f = calcularFrete(opcoes.cep, reais(sub));
      if (!f) erros.push('CEP inválido');
      else frete = f.opcoes.find((o) => o.id === (opcoes.frete || 'economico')) || f.opcoes[0];
    }
    const valorFrete = frete ? centavos(frete.valor) : 0;

    return {
      linhas,
      pecas: linhas.reduce((t, l) => t + l.qtd, 0),
      subtotal: reais(sub),
      cupom: pctCupom ? { codigo, percentual: pctCupom, desconto: reais(descCupom), aplicado: usaCupom } : null,
      descontoPix: reais(descPix),
      frete,
      total: reais(base - descPix + valorFrete),
      parcelas: opcoes.pagamento === 'cartao' ? CFG.parcelasSemJuros : 1,
      erros,
    };
  }

  return { centavos, reais, pctPix, precoPix, parcela, calcularFrete, resumoPedido };
});
