/* ============================================================
   CAVELLE — Servidor
   Serve o site (pasta public/) e uma API simples de pedidos.

   Variáveis de ambiente:
     PORT          porta (padrão 3000)
     ADMIN_TOKEN   senha do painel /admin.html (sem ela o painel fica desligado)
     DATA_DIR      pasta onde os pedidos são gravados (padrão ./data)
   ============================================================ */
'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG = require('./public/assets/js/config.js');
const PRODUTOS = require('./public/assets/js/produtos.js');
const REGRAS = require('./public/assets/js/regras.js')(CONFIG, PRODUTOS);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ARQ_PEDIDOS = path.join(DATA_DIR, 'pedidos.json');

// Origem dos envios (não é exibida no site — usada para frete/etiquetas)
const ORIGEM = {
  rua: 'Rua Pacajás, 82',
  bairro: 'Vila Cosmopolita (Itaquera/Guaianases)',
  cidade: 'São Paulo',
  uf: 'SP',
  cep: '08421-110',
};

const STATUS = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'];

// ── Armazenamento em arquivo JSON (gravação atômica) ──────
fs.mkdirSync(DATA_DIR, { recursive: true });
function lerPedidos() {
  try { return JSON.parse(fs.readFileSync(ARQ_PEDIDOS, 'utf8')); } catch (e) { return []; }
}
function gravarPedidos(lista) {
  const tmp = `${ARQ_PEDIDOS}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lista, null, 2));
  fs.renameSync(tmp, ARQ_PEDIDOS);
}
function proximoNumero(lista) {
  const max = lista.reduce((m, p) => Math.max(m, Number(String(p.numero).replace(/\D/g, '')) || 0), 1000);
  return `CV${max + 1}`;
}

// ── App ───────────────────────────────────────────────────
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '50kb' }));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  next();
});

// Limite simples de requisições por IP para criação de pedidos
const tentativas = new Map();
function limitar(max, janelaMs) {
  return (req, res, next) => {
    const agora = Date.now();
    const chave = req.ip;
    const lista = (tentativas.get(chave) || []).filter((t) => agora - t < janelaMs);
    if (lista.length >= max) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' });
    lista.push(agora);
    tentativas.set(chave, lista);
    next();
  };
}

// ── Validação de dados do cliente ─────────────────────────
const soNum = (v) => String(v || '').replace(/\D/g, '');
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
const texto = (v, max = 120) => String(v || '').trim().slice(0, max);
function validarCliente(c = {}) {
  const cli = {
    nome: texto(c.nome), email: texto(c.email).toLowerCase(), telefone: texto(c.telefone, 20), cpf: texto(c.cpf, 14),
    cep: texto(c.cep, 9), rua: texto(c.rua), numero: texto(c.numero, 20), complemento: texto(c.complemento, 60),
    bairro: texto(c.bairro, 80), cidade: texto(c.cidade, 80), uf: texto(c.uf, 2).toUpperCase(),
  };
  const erros = [];
  if (cli.nome.split(/\s+/).length < 2) erros.push('nome completo');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cli.email)) erros.push('e-mail');
  if (soNum(cli.telefone).length < 10) erros.push('WhatsApp');
  if (!cpfValido(cli.cpf)) erros.push('CPF');
  if (soNum(cli.cep).length !== 8) erros.push('CEP');
  if (!cli.rua || !cli.numero || !cli.bairro || !cli.cidade || !/^[A-Z]{2}$/.test(cli.uf)) erros.push('endereço');
  return { cli, erros };
}

// ── API pública ───────────────────────────────────────────
app.get('/api/saude', (req, res) => res.json({ ok: true }));

app.get('/api/produtos', (req, res) => res.json(PRODUTOS));

app.post('/api/frete', (req, res) => {
  const r = REGRAS.calcularFrete(req.body.cep, Number(req.body.subtotal) || 0);
  if (!r) return res.status(400).json({ erro: 'CEP inválido' });
  res.json({ origem: ORIGEM.cep, ...r });
});

app.post('/api/pedidos', limitar(8, 10 * 60 * 1000), (req, res) => {
  const { itens, cliente, frete, pagamento, cupom } = req.body || {};
  if (!Array.isArray(itens) || !itens.length || itens.length > 30) return res.status(400).json({ erro: 'Sacola inválida.' });
  if (!['pix', 'cartao'].includes(pagamento)) return res.status(400).json({ erro: 'Forma de pagamento inválida.' });

  const { cli, erros } = validarCliente(cliente);
  if (erros.length) return res.status(400).json({ erro: `Confira: ${erros.join(', ')}.` });

  // O total é SEMPRE recalculado no servidor — nunca confiamos no navegador
  const r = REGRAS.resumoPedido(itens, { cep: cli.cep, frete, pagamento, cupom });
  if (r.erros.length) return res.status(409).json({ erro: r.erros.join(' · ') });

  const lista = lerPedidos();
  const pedido = {
    numero: proximoNumero(lista),
    criadoEm: new Date().toISOString(),
    status: 'aguardando_pagamento',
    pagamento,
    cliente: cli,
    linhas: r.linhas,
    pecas: r.pecas,
    subtotal: r.subtotal,
    cupom: r.cupom,
    descontoPix: r.descontoPix,
    frete: r.frete,
    total: r.total,
    parcelas: r.parcelas,
    rastreio: '',
    historico: [{ status: 'aguardando_pagamento', em: new Date().toISOString() }],
  };
  lista.unshift(pedido);
  gravarPedidos(lista);
  console.log(`Novo pedido ${pedido.numero} — ${cli.nome} — R$ ${pedido.total.toFixed(2)}`);
  res.status(201).json(pedido);
});

// Acompanhamento pela cliente: número + e-mail
app.get('/api/pedidos/:numero', limitar(30, 10 * 60 * 1000), (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const p = lerPedidos().find((x) => x.numero === String(req.params.numero).toUpperCase());
  if (!p || !email || p.cliente.email !== email) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  res.json({
    numero: p.numero, criadoEm: p.criadoEm, status: p.status, total: p.total, rastreio: p.rastreio,
    linhas: p.linhas.map(({ nome, cor, tam, qtd }) => ({ nome, cor, tam, qtd })), historico: p.historico,
  });
});

// ── API do painel (protegida por ADMIN_TOKEN) ─────────────
function admin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ erro: 'Painel desativado: defina ADMIN_TOKEN no servidor.' });
  const enviado = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(enviado);
  const b = Buffer.from(ADMIN_TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ erro: 'Senha incorreta.' });
  next();
}
app.get('/api/admin/pedidos', limitar(120, 10 * 60 * 1000), admin, (req, res) => res.json({ pedidos: lerPedidos(), status: STATUS, origem: ORIGEM }));
app.patch('/api/admin/pedidos/:numero', admin, (req, res) => {
  const lista = lerPedidos();
  const p = lista.find((x) => x.numero === req.params.numero);
  if (!p) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  const { status, rastreio } = req.body || {};
  if (status !== undefined) {
    if (!STATUS.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });
    if (status !== p.status) { p.status = status; p.historico.push({ status, em: new Date().toISOString() }); }
  }
  if (rastreio !== undefined) p.rastreio = texto(rastreio, 40);
  gravarPedidos(lista);
  res.json(p);
});

// ── Site ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders(res, arquivo) {
    if (/\.(jpg|png|svg|woff2)$/.test(arquivo)) res.set('Cache-Control', 'public, max-age=2592000');
    else res.set('Cache-Control', 'no-cache');
  },
}));
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CAVELLE rodando em http://localhost:${PORT}`);
    if (!ADMIN_TOKEN) console.log('Aviso: ADMIN_TOKEN não definido — painel de pedidos desativado.');
  });
}

module.exports = app;
