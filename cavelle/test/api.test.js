const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cavelle-'));
process.env.ADMIN_TOKEN = 'segredo-teste';
const app = require('../server.js');
const CFG = require('../public/assets/js/config.js');
const PRODUTOS = require('../public/assets/js/produtos.js');
const REGRAS = require('../public/assets/js/regras.js')(CFG, PRODUTOS);

const cliente = {
  nome: 'Maria Teste', email: 'maria@teste.com', telefone: '(11) 98888-7777', cpf: '529.982.247-25',
  cep: '01310-100', rua: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP',
};

let base;
let srv;
test.before(() => new Promise((ok) => { srv = app.listen(0, () => { base = `http://127.0.0.1:${srv.address().port}`; ok(); }); }));
test.after(() => srv.close());

const post = (url, body, headers = {}) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('cria pedido recalculando o total no servidor', async () => {
  const r = await post('/api/pedidos', { itens: [{ id: 'legging-sculpt', cor: 'Marrom', tam: 'M', qtd: 1, preco: 1 }], cliente, frete: 'economico', pagamento: 'pix' });
  assert.strictEqual(r.status, 201);
  const p = await r.json();
  assert.match(p.numero, /^CV\d+$/);
  const preco = PRODUTOS.find((x) => x.id === 'legging-sculpt').preco;
  assert.strictEqual(p.subtotal, preco);
  assert.strictEqual(p.total, Math.round((REGRAS.precoPix(preco) + p.frete.valor) * 100) / 100);
});

test('recusa CPF inválido e sacola vazia', async () => {
  assert.strictEqual((await post('/api/pedidos', { itens: [{ id: 'legging-sculpt', cor: 'Marrom', tam: 'M', qtd: 1 }], cliente: { ...cliente, cpf: '111.111.111-11' }, pagamento: 'pix' })).status, 400);
  assert.strictEqual((await post('/api/pedidos', { itens: [], cliente, pagamento: 'pix' })).status, 400);
});

test('acompanhamento exige o e-mail correto', async () => {
  assert.strictEqual((await fetch(`${base}/api/pedidos/CV1001?email=maria@teste.com`)).status, 200);
  assert.strictEqual((await fetch(`${base}/api/pedidos/CV1001?email=outra@teste.com`)).status, 404);
});

test('painel exige senha e atualiza status', async () => {
  assert.strictEqual((await fetch(`${base}/api/admin/pedidos`)).status, 401);
  const auth = { Authorization: 'Bearer segredo-teste' };
  const r = await fetch(`${base}/api/admin/pedidos/CV1001`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ status: 'enviado', rastreio: 'AA123456789BR' }) });
  assert.strictEqual(r.status, 200);
  const p = await r.json();
  assert.strictEqual(p.status, 'enviado');
  assert.strictEqual(p.rastreio, 'AA123456789BR');
});
