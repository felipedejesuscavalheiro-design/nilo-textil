const test = require('node:test');
const assert = require('node:assert');
const CFG = require('../public/assets/js/config.js');
const PRODUTOS = require('../public/assets/js/produtos.js');
const R = require('../public/assets/js/regras.js')(CFG, PRODUTOS);

test('preço no Pix = preço × 0,95 arredondado ao centavo (exemplo do briefing)', () => {
  assert.strictEqual(R.precoPix(279.9), 265.91);
  assert.strictEqual(R.precoPix(189.9), 180.41);
  assert.strictEqual(R.precoPix(159.9), 151.91);
});

test('parcela em 2x sem juros', () => {
  assert.strictEqual(R.parcela(279.9), 139.95);
  assert.strictEqual(R.parcela(189.9), 94.95);
});

test('frete grátis a partir de R$499 e cobrado abaixo disso', () => {
  assert.strictEqual(R.calcularFrete('01310-100', 499).opcoes[0].valor, 0);
  assert.ok(R.calcularFrete('01310-100', 498.99).opcoes[0].valor > 0);
  assert.strictEqual(R.calcularFrete('123', 100), null);
});

test('resumo do pedido aplica Pix sobre produtos e não sobre o frete', () => {
  const bolsa = PRODUTOS.find((p) => p.id === 'bolsa-puffer');
  const r = R.resumoPedido([{ id: 'bolsa-puffer', cor: 'Off-white', tam: 'Único', qtd: 1 }], { cep: '20000-000', pagamento: 'pix' });
  assert.deepStrictEqual(r.erros, []);
  assert.strictEqual(r.subtotal, bolsa.preco);
  assert.strictEqual(r.descontoPix, Math.round((bolsa.preco - R.precoPix(bolsa.preco)) * 100) / 100);
  assert.ok(r.frete.valor > 0, 'abaixo de R$499 o frete é cobrado');
  assert.strictEqual(r.total, Math.round((R.precoPix(bolsa.preco) + r.frete.valor) * 100) / 100);
});

test('resumo recusa item inexistente e quantidade acima do estoque', () => {
  assert.ok(R.resumoPedido([{ id: 'nao-existe', cor: 'x', tam: 'P', qtd: 1 }]).erros.length);
  assert.ok(R.resumoPedido([{ id: 'legging-sculpt', cor: 'Marrom', tam: 'M', qtd: 999 }]).erros.length);
});

test('catálogo: todo produto tem cor, fotos e estoque para cada tamanho', () => {
  const fs = require('fs');
  const path = require('path');
  for (const p of PRODUTOS) {
    assert.ok(p.cores.length, p.id);
    for (const c of p.cores) {
      assert.ok(c.fotos.length, `${p.id} ${c.nome}`);
      c.fotos.forEach((f) => assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', f)), f));
      p.tamanhos.forEach((t) => assert.ok(t in c.estoque, `${p.id} ${c.nome} ${t}`));
    }
  }
});

test('descontos não são cumulativos: cupom e Pix nunca se somam', () => {
  const CFG2 = { ...CFG, cupons: { TESTE10: 0.10 } };
  const R2 = require('../public/assets/js/regras.js')(CFG2, PRODUTOS);
  const itens = [{ id: 'macaquinho-bloom', cor: 'Rosa', tam: 'M', qtd: 1 }];
  const preco = PRODUTOS.find((p) => p.id === 'macaquinho-bloom').preco;
  const r = R2.resumoPedido(itens, { pagamento: 'pix', cupom: 'TESTE10' });
  assert.strictEqual(r.cupom.aplicado, true);
  assert.strictEqual(r.descontoPix, 0);
  assert.strictEqual(r.total, Math.round((preco - r.cupom.desconto) * 100) / 100);
  const c = R2.resumoPedido(itens, { pagamento: 'cartao', cupom: 'TESTE10' });
  assert.strictEqual(c.cupom.aplicado, true);
  assert.strictEqual(c.descontoPix, 0);
});

test('sem cupons cadastrados, qualquer código é recusado', () => {
  const r = R.resumoPedido([{ id: 'macaquinho-bloom', cor: 'Rosa', tam: 'M', qtd: 1 }], { pagamento: 'pix', cupom: 'QUALQUER' });
  assert.ok(r.erros.includes('Cupom inválido'));
});

test('cupom menor que o Pix: mantém o Pix e não aplica o cupom', () => {
  const CFG2 = { ...CFG, cupons: { TESTE3: 0.03 } };
  const R2 = require('../public/assets/js/regras.js')(CFG2, PRODUTOS);
  const r = R2.resumoPedido([{ id: 'macaquinho-bloom', cor: 'Rosa', tam: 'M', qtd: 1 }], { pagamento: 'pix', cupom: 'TESTE3' });
  assert.strictEqual(r.cupom.aplicado, false);
  assert.ok(r.descontoPix > 0);
});
