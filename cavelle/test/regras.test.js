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
  const r = R.resumoPedido([{ id: 'bolsa-puffer', cor: 'Off-white', tam: 'Único', qtd: 1 }], { cep: '20000-000', pagamento: 'pix' });
  assert.deepStrictEqual(r.erros, []);
  assert.strictEqual(r.subtotal, 259.9);
  assert.strictEqual(r.descontoPix, 12.99); // 259,90 − 246,91 (preço no Pix)
  assert.strictEqual(r.total, Math.round((246.91 + r.frete.valor) * 100) / 100);
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
