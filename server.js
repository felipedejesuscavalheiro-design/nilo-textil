// ============================================================
// server.js — Nilo Têxtil API Server
// Node.js + Express + SQLite | JWT Auth | Full Audit Log
// ============================================================
'use strict';

const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path     = require('path');
const fs       = require('fs');
const db       = require('./db');

// nodemailer opcional — só ativa se EMAIL_USER estiver configurado
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch(e) { console.warn('nodemailer não instalado — e-mail desativado'); }

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nilotextil_jwt_secret_mude_em_producao_2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// HELPERS
// ============================================================
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
}

function audit(entity_type, entity_id, entity_name, action, opts = {}) {
  const { field, old_val, new_val, user_id, user_name, ip } = opts;
  db.prepare(`
    INSERT INTO audit_log (entity_type,entity_id,entity_name,action,field_name,old_value,new_value,user_id,user_name,ip_address)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(entity_type, entity_id, entity_name || '', action,
         field || null, old_val != null ? String(old_val) : null,
         new_val != null ? String(new_val) : null,
         user_id || null, user_name || null, ip || null);
}

// ── Diff two objects, log each changed field ──
function auditDiff(entity_type, entity_id, entity_name, oldObj, newObj, opts = {}) {
  const skip = new Set(['updated_at','updated_by','created_at','created_by']);
  for (const [key, newVal] of Object.entries(newObj)) {
    if (skip.has(key)) continue;
    if (String(oldObj[key]) !== String(newVal)) {
      audit(entity_type, entity_id, entity_name, 'update',
        { field: key, old_val: oldObj[key], new_val: newVal, ...opts });
    }
  }
}

// ── Compute lote custo_total ──
function computeCusto(lote) {
  return (lote.custo_tecelagem || 0) + (lote.custo_tinturaria || 0) + (lote.custo_frete || 0);
}

// ── Generate batch code ──
function gerarCodigo(tipo) {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${tipo}-${ts}-${rnd}`;
}

// ── Notification generator ──
function gerarNotificacoes() {
  const alertaDias = Number(db.prepare(`SELECT value FROM config WHERE key='alerta_atraso_dias'`).get()?.value || 3);
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(Date.now() + alertaDias * 86400000).toISOString().slice(0, 10);

  const atrasados = db.prepare(`
    SELECT l.id, l.codigo, l.data_entrega_prevista
    FROM lotes l
    WHERE l.status NOT IN ('entregue','cancelado')
      AND l.data_entrega_prevista IS NOT NULL
      AND l.data_entrega_prevista < ?
  `).all(hoje);

  atrasados.forEach(l => {
    const exists = db.prepare(`SELECT id FROM notifications WHERE lote_id=? AND tipo='atraso' AND lida=0`).get(l.id);
    if (!exists) {
      db.prepare(`INSERT INTO notifications (tipo,mensagem,lote_id) VALUES (?,?,?)`)
        .run('atraso', `Lote ${l.codigo} está atrasado (previsto: ${l.data_entrega_prevista})`, l.id);
    }
  });

  const proximos = db.prepare(`
    SELECT l.id, l.codigo, l.data_entrega_prevista
    FROM lotes l
    WHERE l.status NOT IN ('entregue','cancelado')
      AND l.data_entrega_prevista BETWEEN ? AND ?
  `).all(hoje, limite);

  proximos.forEach(l => {
    const exists = db.prepare(`SELECT id FROM notifications WHERE lote_id=? AND tipo='entrega_proxima' AND lida=0`).get(l.id);
    if (!exists) {
      db.prepare(`INSERT INTO notifications (tipo,mensagem,lote_id) VALUES (?,?,?)`)
        .run('entrega_proxima', `Lote ${l.codigo} tem entrega prevista em ${l.data_entrega_prevista}`, l.id);
    }
  });
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Permissão insuficiente' });
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  };
}

const ADMIN   = ['admin'];
const GERENTE = ['admin','gerente'];
const ALL     = ['admin','gerente','visualizador'];

// ============================================================
// ── AUTH ROUTES ──────────────────────────────────────────────
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha obrigatórios' });

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'E-mail não encontrado' });

  if (!bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Senha incorreta' });

  db.prepare('UPDATE users SET last_login=? WHERE id=?').run(now(), user.id);
  audit('user', user.id, user.name, 'login', { user_id: user.id, user_name: user.name, ip: getIP(req) });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/auth/me
app.get('/api/auth/me', auth(ALL), (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,last_login FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', auth(ALL), (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ error: 'Campos obrigatórios' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Senha mínima: 6 caracteres' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password_hash))
    return res.status(401).json({ error: 'Senha atual incorreta' });

  db.prepare('UPDATE users SET password_hash=?, updated_at=? WHERE id=?')
    .run(bcrypt.hashSync(new_password, 10), now(), user.id);

  audit('user', user.id, user.name, 'update',
    { field: 'password', old_val: '***', new_val: '***', user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });

  res.json({ ok: true });
});

// ============================================================
// ── USERS ROUTES (admin only) ────────────────────────────────
// ============================================================

// GET /api/users
app.get('/api/users', auth(ADMIN), (req, res) => {
  const users = db.prepare('SELECT id,name,email,role,active,created_at,last_login FROM users ORDER BY name').all();
  res.json(users);
});

// POST /api/users
app.post('/api/users', auth(ADMIN), (req, res) => {
  const { name, email, password, role = 'visualizador' } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, e-mail e senha obrigatórios' });
  if (!['admin','gerente','visualizador'].includes(role)) return res.status(400).json({ error: 'Role inválido' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha mínima: 6 caracteres' });

  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

  const id = uuidv4();
  db.prepare('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)')
    .run(id, name.trim(), email.toLowerCase().trim(), bcrypt.hashSync(password, 10), role);

  audit('user', id, name, 'create', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.status(201).json({ id, name, email, role });
});

// PUT /api/users/:id
app.put('/api/users/:id', auth(ADMIN), (req, res) => {
  const { name, email, role, active, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const updates = {
    name:     name  !== undefined ? name.trim()  : user.name,
    email:    email !== undefined ? email.toLowerCase().trim() : user.email,
    role:     role  !== undefined ? role         : user.role,
    active:   active !== undefined ? (active ? 1 : 0) : user.active,
    password_hash: password ? bcrypt.hashSync(password, 10) : user.password_hash,
    updated_at: now()
  };

  db.prepare(`UPDATE users SET name=?,email=?,role=?,active=?,password_hash=?,updated_at=? WHERE id=?`)
    .run(updates.name, updates.email, updates.role, updates.active, updates.password_hash, updates.updated_at, user.id);

  audit('user', user.id, updates.name, 'update',
    { field: 'profile', user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json({ id: user.id, ...updates });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', auth(ADMIN), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Não pode excluir a si mesmo' });
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.prepare('UPDATE users SET active=0, updated_at=? WHERE id=?').run(now(), user.id);
  audit('user', user.id, user.name, 'delete', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json({ ok: true });
});

// ============================================================
// ── TECELAGENS ───────────────────────────────────────────────
// ============================================================

app.get('/api/tecelagens', auth(ALL), (req, res) => {
  const rows = db.prepare('SELECT * FROM tecelagens ORDER BY ativo DESC, nome').all();
  res.json(rows);
});

app.post('/api/tecelagens', auth(GERENTE), (req, res) => {
  const { nome, capacidade_kg, prazo_dias, tipo='ambos', contato='', telefone='', email='', observacoes='' } = req.body || {};
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
  const id = uuidv4();
  db.prepare(`INSERT INTO tecelagens (id,nome,capacidade_kg,prazo_dias,tipo,contato,telefone,email,observacoes,created_by)
              VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, nome.trim(), capacidade_kg||0, prazo_dias||30, tipo, contato, telefone, email, observacoes, req.user.id);
  audit('tecelagem', id, nome, 'create', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.status(201).json(db.prepare('SELECT * FROM tecelagens WHERE id=?').get(id));
});

app.put('/api/tecelagens/:id', auth(GERENTE), (req, res) => {
  const old = db.prepare('SELECT * FROM tecelagens WHERE id=?').get(req.params.id);
  if (!old) return res.status(404).json({ error: 'Não encontrada' });
  const f = { ...old, ...req.body, updated_at: now() };
  db.prepare(`UPDATE tecelagens SET nome=?,capacidade_kg=?,prazo_dias=?,tipo=?,contato=?,telefone=?,email=?,observacoes=?,ativo=?,updated_at=?
              WHERE id=?`)
    .run(f.nome,f.capacidade_kg,f.prazo_dias,f.tipo,f.contato,f.telefone,f.email,f.observacoes,f.ativo?1:0,f.updated_at,old.id);
  auditDiff('tecelagem', old.id, f.nome, old, f, { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json(db.prepare('SELECT * FROM tecelagens WHERE id=?').get(old.id));
});

app.delete('/api/tecelagens/:id', auth(ADMIN), (req, res) => {
  const t = db.prepare('SELECT * FROM tecelagens WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Não encontrada' });
  db.prepare('UPDATE tecelagens SET ativo=0, updated_at=? WHERE id=?').run(now(), t.id);
  audit('tecelagem', t.id, t.nome, 'delete', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json({ ok: true });
});

// ============================================================
// ── TINTURARIAS ──────────────────────────────────────────────
// ============================================================

app.get('/api/tinturarias', auth(ALL), (req, res) => {
  const rows = db.prepare('SELECT * FROM tinturarias ORDER BY ativo DESC, prioridade, nome').all();
  res.json(rows);
});

app.post('/api/tinturarias', auth(GERENTE), (req, res) => {
  const { nome, capacidade_kg, prazo_dias, tipo='ambos', prioridade=1, contato='', telefone='', email='', custo_por_kg=0, observacoes='' } = req.body || {};
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
  const id = uuidv4();
  db.prepare(`INSERT INTO tinturarias (id,nome,capacidade_kg,prazo_dias,tipo,prioridade,contato,telefone,email,custo_por_kg,observacoes,created_by)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, nome.trim(), capacidade_kg||0, prazo_dias||45, tipo, prioridade, contato, telefone, email, custo_por_kg, observacoes, req.user.id);
  audit('tinturaria', id, nome, 'create', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.status(201).json(db.prepare('SELECT * FROM tinturarias WHERE id=?').get(id));
});

app.put('/api/tinturarias/:id', auth(GERENTE), (req, res) => {
  const old = db.prepare('SELECT * FROM tinturarias WHERE id=?').get(req.params.id);
  if (!old) return res.status(404).json({ error: 'Não encontrada' });
  const f = { ...old, ...req.body, updated_at: now() };
  db.prepare(`UPDATE tinturarias SET nome=?,capacidade_kg=?,prazo_dias=?,tipo=?,prioridade=?,contato=?,telefone=?,email=?,custo_por_kg=?,observacoes=?,ativo=?,updated_at=?
              WHERE id=?`)
    .run(f.nome,f.capacidade_kg,f.prazo_dias,f.tipo,f.prioridade,f.contato,f.telefone,f.email,f.custo_por_kg,f.observacoes,f.ativo?1:0,f.updated_at,old.id);
  auditDiff('tinturaria', old.id, f.nome, old, f, { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json(db.prepare('SELECT * FROM tinturarias WHERE id=?').get(old.id));
});

app.delete('/api/tinturarias/:id', auth(ADMIN), (req, res) => {
  const t = db.prepare('SELECT * FROM tinturarias WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Não encontrada' });
  db.prepare('UPDATE tinturarias SET ativo=0, updated_at=? WHERE id=?').run(now(), t.id);
  audit('tinturaria', t.id, t.nome, 'delete', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json({ ok: true });
});

// ============================================================
// ── LOTES ────────────────────────────────────────────────────
// ============================================================

const LOTE_JOIN = `
  SELECT l.*,
    t.nome  AS tecelagem_nome,
    ti.nome AS tinturaria_nome,
    u.name  AS created_by_name
  FROM lotes l
  LEFT JOIN tecelagens  t  ON l.tecelagem_id  = t.id
  LEFT JOIN tinturarias ti ON l.tinturaria_id = ti.id
  LEFT JOIN users       u  ON l.created_by    = u.id
`;

app.get('/api/lotes', auth(ALL), (req, res) => {
  let where = 'WHERE 1=1';
  const params = [];
  if (req.query.status) { where += ' AND l.status=?'; params.push(req.query.status); }
  if (req.query.tipo)   { where += ' AND l.tipo=?';   params.push(req.query.tipo); }
  if (req.query.tinturaria_id) { where += ' AND l.tinturaria_id=?'; params.push(req.query.tinturaria_id); }
  const rows = db.prepare(`${LOTE_JOIN} ${where} ORDER BY l.created_at DESC`).all(...params);
  gerarNotificacoes();
  res.json(rows);
});

app.get('/api/lotes/:id', auth(ALL), (req, res) => {
  const row = db.prepare(`${LOTE_JOIN} WHERE l.id=?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Lote não encontrado' });
  res.json(row);
});

app.post('/api/lotes', auth(GERENTE), (req, res) => {
  const {
    tipo, peso_kg, kg_recebido=0, cor='', referencia='',
    tecelagem_id, tinturaria_id, status='fio',
    data_envio_tecelagem, data_prevista_tecelagem,
    data_envio_tinturaria, data_prevista_tinturaria,
    data_entrega_prevista, data_entrega_real,
    custo_tecelagem=0, custo_tinturaria=0, custo_frete=0,
    notas=''
  } = req.body || {};

  if (!tipo || !peso_kg) return res.status(400).json({ error: 'Tipo e peso obrigatórios' });
  if (!['PT','LISO'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });

  const id = uuidv4();
  const codigo = gerarCodigo(tipo);
  const custo_total = Number(custo_tecelagem) + Number(custo_tinturaria) + Number(custo_frete);

  // Validate tinturaria prazo → compute data_entrega_prevista if not given
  let entregaPrevista = data_entrega_prevista;
  if (!entregaPrevista && tinturaria_id && data_envio_tinturaria) {
    const tint = db.prepare('SELECT prazo_dias FROM tinturarias WHERE id=?').get(tinturaria_id);
    if (tint) {
      const d = new Date(data_envio_tinturaria);
      d.setDate(d.getDate() + tint.prazo_dias);
      entregaPrevista = d.toISOString().slice(0, 10);
    }
  }

  db.prepare(`
    INSERT INTO lotes (id,codigo,tipo,peso_kg,kg_recebido,cor,referencia,tecelagem_id,tinturaria_id,status,
      data_envio_tecelagem,data_prevista_tecelagem,data_envio_tinturaria,data_prevista_tinturaria,
      data_entrega_prevista,data_entrega_real,custo_tecelagem,custo_tinturaria,custo_frete,custo_total,notas,created_by,updated_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id,codigo,tipo,peso_kg,Number(kg_recebido)||0,cor,referencia,tecelagem_id||null,tinturaria_id||null,status,
         data_envio_tecelagem||null,data_prevista_tecelagem||null,
         data_envio_tinturaria||null,data_prevista_tinturaria||null,
         entregaPrevista||null,data_entrega_real||null,
         custo_tecelagem,custo_tinturaria,custo_frete,custo_total,notas,
         req.user.id, req.user.id);

  audit('lote', id, codigo, 'create',
    { new_val: JSON.stringify({ tipo, peso_kg, status }), user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });

  res.status(201).json(db.prepare(`${LOTE_JOIN} WHERE l.id=?`).get(id));
});

app.put('/api/lotes/:id', auth(GERENTE), (req, res) => {
  const old = db.prepare('SELECT * FROM lotes WHERE id=?').get(req.params.id);
  if (!old) return res.status(404).json({ error: 'Lote não encontrado' });

  // Detect status change for specific audit entry
  if (req.body.status && req.body.status !== old.status) {
    audit('lote', old.id, old.codigo, 'status_change',
      { field: 'status', old_val: old.status, new_val: req.body.status,
        user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  }

  const upd = {
    ...old,
    ...req.body,
    updated_at: now(),
    updated_by: req.user.id
  };
  upd.custo_total = Number(upd.custo_tecelagem||0) + Number(upd.custo_tinturaria||0) + Number(upd.custo_frete||0);

  // Auto-compute entrega_prevista when tinturaria changes
  if (!upd.data_entrega_prevista && upd.tinturaria_id && upd.data_envio_tinturaria) {
    const tint = db.prepare('SELECT prazo_dias FROM tinturarias WHERE id=?').get(upd.tinturaria_id);
    if (tint) {
      const d = new Date(upd.data_envio_tinturaria);
      d.setDate(d.getDate() + tint.prazo_dias);
      upd.data_entrega_prevista = d.toISOString().slice(0, 10);
    }
  }

  db.prepare(`
    UPDATE lotes SET tipo=?,peso_kg=?,kg_recebido=?,cor=?,referencia=?,tecelagem_id=?,tinturaria_id=?,status=?,
      data_envio_tecelagem=?,data_prevista_tecelagem=?,data_envio_tinturaria=?,data_prevista_tinturaria=?,
      data_entrega_prevista=?,data_entrega_real=?,custo_tecelagem=?,custo_tinturaria=?,custo_frete=?,custo_total=?,
      notas=?,updated_at=?,updated_by=?
    WHERE id=?
  `).run(upd.tipo,upd.peso_kg,Number(upd.kg_recebido)||0,upd.cor,upd.referencia,upd.tecelagem_id||null,upd.tinturaria_id||null,upd.status,
         upd.data_envio_tecelagem||null,upd.data_prevista_tecelagem||null,
         upd.data_envio_tinturaria||null,upd.data_prevista_tinturaria||null,
         upd.data_entrega_prevista||null,upd.data_entrega_real||null,
         upd.custo_tecelagem,upd.custo_tinturaria,upd.custo_frete,upd.custo_total,
         upd.notas,upd.updated_at,upd.updated_by, old.id);

  auditDiff('lote', old.id, old.codigo, old, upd,
    { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });

  res.json(db.prepare(`${LOTE_JOIN} WHERE l.id=?`).get(old.id));
});

app.delete('/api/lotes/:id', auth(GERENTE), (req, res) => {
  const l = db.prepare('SELECT * FROM lotes WHERE id=?').get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Lote não encontrado' });
  db.prepare('DELETE FROM lotes WHERE id=?').run(l.id);
  audit('lote', l.id, l.codigo, 'delete', { user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  res.json({ ok: true });
});

// ── Lote history
app.get('/api/lotes/:id/history', auth(ALL), (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM audit_log
    WHERE entity_type='lote' AND entity_id=?
    ORDER BY created_at DESC LIMIT 200
  `).all(req.params.id);
  res.json(rows);
});

// ── Batch status update (quick transition)
app.patch('/api/lotes/:id/status', auth(GERENTE), (req, res) => {
  const { status } = req.body || {};
  const VALID = ['fio','tecelagem','tinturaria','pronto','entregue','cancelado'];
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Status inválido' });

  const l = db.prepare('SELECT * FROM lotes WHERE id=?').get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Lote não encontrado' });

  const updates = { status, updated_at: now(), updated_by: req.user.id };
  if (status === 'entregue' && !l.data_entrega_real) {
    updates.data_entrega_real = new Date().toISOString().slice(0, 10);
  }

  db.prepare('UPDATE lotes SET status=?,updated_at=?,updated_by=?,data_entrega_real=COALESCE(?,data_entrega_real) WHERE id=?')
    .run(updates.status, updates.updated_at, updates.updated_by, updates.data_entrega_real || null, l.id);

  audit('lote', l.id, l.codigo, 'status_change',
    { field: 'status', old_val: l.status, new_val: status, user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });

  res.json(db.prepare(`${LOTE_JOIN} WHERE l.id=?`).get(l.id));
});

// ============================================================
// ── DASHBOARD ────────────────────────────────────────────────
// ============================================================
app.get('/api/dashboard', auth(ALL), (req, res) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const em60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

  // Pipeline counts
  const pipeline = db.prepare(`
    SELECT status, COUNT(*) as qtd, COALESCE(SUM(peso_kg),0) as kg
    FROM lotes WHERE status NOT IN ('cancelado')
    GROUP BY status
  `).all();

  // Atrasados — só conta se tem saldo em aberto (peso_kg - kg_recebido > 0)
  const atrasados = db.prepare(`
    SELECT COUNT(*) as n FROM lotes
    WHERE status NOT IN ('entregue','cancelado')
      AND data_entrega_prevista IS NOT NULL AND data_entrega_prevista < ?
      AND (peso_kg - COALESCE(kg_recebido,0)) > 0
  `).get(hoje).n;

  // Próximas entregas (60 dias) — inclui saldo em aberto
  const entregas = db.prepare(`
    SELECT l.*, ti.nome as tinturaria_nome,
           ROUND(l.peso_kg - COALESCE(l.kg_recebido,0), 2) as kg_saldo
    FROM lotes l
    LEFT JOIN tinturarias ti ON l.tinturaria_id=ti.id
    WHERE l.status NOT IN ('entregue','cancelado')
      AND l.data_entrega_prevista BETWEEN ? AND ?
      AND (l.peso_kg - COALESCE(l.kg_recebido,0)) > 0
    ORDER BY l.data_entrega_prevista LIMIT 20
  `).all(hoje, em60);

  // Distribuição por tinturaria
  const distTint = db.prepare(`
    SELECT ti.nome, COUNT(l.id) as lotes, COALESCE(SUM(l.peso_kg),0) as kg_total
    FROM lotes l
    JOIN tinturarias ti ON l.tinturaria_id=ti.id
    WHERE l.status NOT IN ('entregue','cancelado')
    GROUP BY ti.id ORDER BY kg_total DESC
  `).all();

  // Custo do mês atual
  const custoMes = db.prepare(`
    SELECT COALESCE(SUM(custo_total),0) as total
    FROM lotes
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m','now')
  `).get().total;

  // Total kg em pipeline
  const kgPipeline = db.prepare(`
    SELECT tipo, COALESCE(SUM(peso_kg),0) as kg
    FROM lotes WHERE status NOT IN ('entregue','cancelado')
    GROUP BY tipo
  `).all();

  // Notificações não lidas
  const notifs = db.prepare('SELECT COUNT(*) as n FROM notifications WHERE lida=0').get().n;

  gerarNotificacoes();

  res.json({ pipeline, atrasados, entregas, distTint, custoMes, kgPipeline, notificacoes: notifs });
});

// ============================================================
// ── PLANEJAMENTO & FORECAST ───────────────────────────────────
// ============================================================
app.get('/api/planejamento', auth(ALL), (req, res) => {
  const cfg = {};
  db.prepare('SELECT key,value FROM config').all().forEach(r => { cfg[r.key] = Number(r.value); });

  const consumoPT   = cfg.consumo_mensal_pt   || 13200;
  const consumoLISO = cfg.consumo_mensal_liso  || 20800;
  const bufferDias  = cfg.buffer_dias          || 15;

  const consumoDiarioPT   = consumoPT   / 30;
  const consumoDiarioLISO = consumoLISO / 30;

  // kg em pipeline por tipo
  const pipeline = { PT: 0, LISO: 0 };
  db.prepare(`
    SELECT tipo, SUM(peso_kg) as kg FROM lotes
    WHERE status NOT IN ('entregue','cancelado') GROUP BY tipo
  `).all().forEach(r => { pipeline[r.tipo] = r.kg; });

  // Cobertura em dias
  const coberturaPT   = pipeline.PT   / consumoDiarioPT;
  const coberturaLISO = pipeline.LISO / consumoDiarioLISO;

  // Entregas por mês (próximos 4 meses)
  const entregasMes = db.prepare(`
    SELECT strftime('%Y-%m', data_entrega_prevista) as mes,
           tipo, COALESCE(SUM(peso_kg),0) as kg, COUNT(*) as lotes
    FROM lotes
    WHERE status NOT IN ('entregue','cancelado')
      AND data_entrega_prevista >= date('now')
      AND data_entrega_prevista <= date('now','+4 months')
    GROUP BY mes, tipo ORDER BY mes
  `).all();

  // Capacidade tinturarias
  const capTint = db.prepare(`
    SELECT id, nome, capacidade_kg, prazo_dias, tipo,
      COALESCE((SELECT SUM(peso_kg) FROM lotes WHERE tinturaria_id=tinturarias.id AND status NOT IN ('entregue','cancelado')),0) as kg_alocado
    FROM tinturarias WHERE ativo=1 ORDER BY prioridade
  `).all().map(t => ({
    ...t,
    pct_ocupacao: t.capacidade_kg > 0 ? Math.round(t.kg_alocado / t.capacidade_kg * 100) : 0,
    disponivel_kg: Math.max(0, t.capacidade_kg - t.kg_alocado)
  }));

  // Recomendação de envio (buffer)
  const recomendPT   = Math.max(0, consumoPT   * (bufferDias / 30) - pipeline.PT);
  const recomendLISO = Math.max(0, consumoLISO * (bufferDias / 30) - pipeline.LISO);

  res.json({
    consumo: { PT: consumoPT, LISO: consumoLISO },
    pipeline,
    cobertura: { PT: Math.round(coberturaPT * 10) / 10, LISO: Math.round(coberturaLISO * 10) / 10 },
    buffer_dias: bufferDias,
    recomendacao_envio: { PT: Math.round(recomendPT), LISO: Math.round(recomendLISO) },
    entregas_mes: entregasMes,
    capacidade_tinturarias: capTint
  });
});

// ============================================================
// ── PREVISÃO DE COMPRA DE FIO ────────────────────────────────
// ============================================================
app.get('/api/previsao-fio', auth(ALL), (req, res) => {
  const cfg = {};
  db.prepare('SELECT key,value FROM config').all().forEach(r => { cfg[r.key] = Number(r.value); });

  const consumoPT   = cfg.consumo_mensal_pt   || 13200;
  const consumoLISO = cfg.consumo_mensal_liso  || 20800;
  const bufferDias  = cfg.buffer_dias          || 15;
  const prazTec     = cfg.prazo_tecelagem_dias || 30; // dias fio→tecido pronto

  const consumoDiarioPT   = consumoPT   / 30;
  const consumoDiarioLISO = consumoLISO / 30;

  // Pipeline atual por tipo e por estágio
  const pipelineRows = db.prepare(`
    SELECT tipo, status, COALESCE(SUM(peso_kg),0) as kg
    FROM lotes WHERE status NOT IN ('entregue','cancelado')
    GROUP BY tipo, status
  `).all();

  const pipeline = { PT: 0, LISO: 0 };
  pipelineRows.forEach(r => { pipeline[r.tipo] = (pipeline[r.tipo] || 0) + r.kg; });

  function calcPrevisao(tipo, consumoDiario) {
    const pipelineKg = pipeline[tipo] || 0;
    const diasCobertura = consumoDiario > 0 ? pipelineKg / consumoDiario : 0;
    // Precisa pedir fio com antecedência de prazo_tecelagem + buffer
    const antecedencia = prazTec + bufferDias;
    const diasParaPedir = diasCobertura - antecedencia;
    const dataEncomendar = new Date();
    dataEncomendar.setDate(dataEncomendar.getDate() + Math.max(0, Math.round(diasParaPedir)));
    // Quanto pedir: consumo do período de tecelagem + buffer
    const kgEncomendar = Math.ceil((consumoDiario * antecedencia) - pipelineKg + (consumoDiario * bufferDias));
    const urgente = diasParaPedir <= 5;
    const atrasado = diasParaPedir < 0;

    return {
      pipeline_kg: Math.round(pipelineKg),
      cobertura_dias: Math.round(diasCobertura * 10) / 10,
      dias_para_pedir: Math.round(diasParaPedir),
      data_encomenda: atrasado ? 'HOJE (atrasado)' : dataEncomendar.toISOString().slice(0, 10),
      kg_recomendar: Math.max(0, kgEncomendar),
      urgente,
      atrasado,
      antecedencia_necessaria: antecedencia
    };
  }

  res.json({
    PT:   calcPrevisao('PT',   consumoDiarioPT),
    LISO: calcPrevisao('LISO', consumoDiarioLISO),
    consumo: { PT: consumoPT, LISO: consumoLISO },
    prazo_tecelagem: prazTec,
    buffer_dias: bufferDias
  });
});

// ============================================================
// ── DISTRIBUIDOR INTELIGENTE ─────────────────────────────────
// ============================================================
app.post('/api/distribuicao/calcular', auth(ALL), (req, res) => {
  const { kg_pt = 0, kg_liso = 0 } = req.body || {};

  if (kg_pt < 0 || kg_liso < 0) return res.status(400).json({ error: 'Valores inválidos' });

  const tinturarias = db.prepare(`
    SELECT t.*,
      COALESCE((SELECT SUM(peso_kg) FROM lotes WHERE tinturaria_id=t.id AND status NOT IN ('entregue','cancelado')),0) as kg_alocado
    FROM tinturarias t WHERE t.ativo=1 ORDER BY t.prioridade, t.prazo_dias
  `).all();

  function distribuir(kgTotal, tipoLabel) {
    if (kgTotal <= 0) return [];
    const aptas = tinturarias.filter(t =>
      (t.tipo === tipoLabel || t.tipo === 'ambos') &&
      t.capacidade_kg > 0 && t.kg_alocado < t.capacidade_kg
    );

    const result = [];
    let restante = kgTotal;

    for (const t of aptas) {
      if (restante <= 0) break;
      const disponivel = Math.max(0, t.capacidade_kg - t.kg_alocado);
      const alocar = Math.min(restante, disponivel);
      if (alocar > 0) {
        const entregaPrev = new Date(Date.now() + t.prazo_dias * 86400000).toISOString().slice(0, 10);
        result.push({
          tinturaria_id:   t.id,
          tinturaria_nome: t.nome,
          prazo_dias:      t.prazo_dias,
          prioridade:      t.prioridade,
          tipo:            t.tipo,
          kg_alocado:      t.kg_alocado,
          disponivel_kg:   disponivel,
          kg_sugerido:     Math.round(alocar),
          pct_capacidade:  Math.round(alocar / t.capacidade_kg * 100),
          data_entrega_est: entregaPrev,
          custo_estimado:  Math.round(alocar * t.custo_por_kg)
        });
        restante -= alocar;
      }
    }

    return { distribuicao: result, kg_total: kgTotal, kg_alocado: kgTotal - restante, kg_excedente: Math.max(0, restante) };
  }

  res.json({
    PT:   distribuir(Number(kg_pt),   'PT'),
    LISO: distribuir(Number(kg_liso), 'LISO'),
    timestamp: now()
  });
});

// ============================================================
// ── FINANCEIRO ───────────────────────────────────────────────
// ============================================================
app.get('/api/financeiro', auth(ALL), (req, res) => {
  // Custo por mês (últimos 6 meses)
  const custoMes = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as mes,
           tipo,
           COUNT(*) as lotes,
           COALESCE(SUM(peso_kg),0) as kg,
           COALESCE(SUM(custo_total),0) as custo
    FROM lotes
    WHERE created_at >= date('now','-6 months')
    GROUP BY mes, tipo ORDER BY mes
  `).all();

  // Custo por tinturaria
  const custoTint = db.prepare(`
    SELECT ti.nome, COUNT(l.id) as lotes, COALESCE(SUM(l.peso_kg),0) as kg,
           COALESCE(SUM(l.custo_tinturaria),0) as custo,
           CASE WHEN SUM(l.peso_kg)>0 THEN ROUND(SUM(l.custo_tinturaria)/SUM(l.peso_kg),2) ELSE 0 END as custo_medio_kg
    FROM lotes l
    JOIN tinturarias ti ON l.tinturaria_id=ti.id
    WHERE l.created_at >= date('now','-6 months')
    GROUP BY ti.id ORDER BY custo DESC
  `).all();

  // Resumo geral
  const resumo = db.prepare(`
    SELECT
      COUNT(*) as total_lotes,
      COALESCE(SUM(peso_kg),0) as total_kg,
      COALESCE(SUM(custo_total),0) as custo_total,
      COALESCE(SUM(custo_tecelagem),0) as custo_tecelagem,
      COALESCE(SUM(custo_tinturaria),0) as custo_tinturaria,
      COALESCE(SUM(custo_frete),0) as custo_frete,
      CASE WHEN SUM(peso_kg)>0 THEN ROUND(SUM(custo_total)/SUM(peso_kg),2) ELSE 0 END as custo_medio_kg
    FROM lotes WHERE created_at >= date('now','-6 months')
  `).get();

  res.json({ custoMes, custoTint, resumo });
});

// ============================================================
// ── AUDIT LOG ────────────────────────────────────────────────
// ============================================================
app.get('/api/audit', auth(ALL), (req, res) => {
  const limit  = Math.min(Number(req.query.limit  || 100), 500);
  const offset = Number(req.query.offset || 0);
  const tipo   = req.query.entity_type;

  let where = 'WHERE 1=1';
  const params = [];
  if (tipo) { where += ' AND entity_type=?'; params.push(tipo); }

  const rows = db.prepare(`SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as n FROM audit_log ${where}`).get(...params).n;

  res.json({ rows, total, limit, offset });
});

// ============================================================
// ── NOTIFICATIONS ────────────────────────────────────────────
// ============================================================
app.get('/api/notifications', auth(ALL), (req, res) => {
  gerarNotificacoes();
  const rows = db.prepare('SELECT * FROM notifications WHERE lida=0 ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows);
});

app.patch('/api/notifications/:id/lida', auth(ALL), (req, res) => {
  db.prepare('UPDATE notifications SET lida=1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.patch('/api/notifications/lida/all', auth(ALL), (req, res) => {
  db.prepare('UPDATE notifications SET lida=1').run();
  res.json({ ok: true });
});

// ============================================================
// ── CONFIG ───────────────────────────────────────────────────
// ============================================================
app.get('/api/config', auth(ALL), (req, res) => {
  const rows = db.prepare('SELECT * FROM config ORDER BY key').all();
  const cfg = {};
  rows.forEach(r => { cfg[r.key] = { value: r.value, label: r.label, tipo: r.tipo }; });
  res.json(cfg);
});

app.put('/api/config', auth(ADMIN), (req, res) => {
  const updates = req.body || {};
  const stmt = db.prepare('UPDATE config SET value=?,updated_at=?,updated_by=? WHERE key=?');
  const n = now();
  for (const [key, value] of Object.entries(updates)) {
    stmt.run(String(value), n, req.user.id, key);
    audit('config', key, key, 'update',
      { field: key, new_val: value, user_id: req.user.id, user_name: req.user.name, ip: getIP(req) });
  }
  const rows = db.prepare('SELECT * FROM config').all();
  const cfg = {};
  rows.forEach(r => { cfg[r.key] = { value: r.value, label: r.label, tipo: r.tipo }; });
  res.json(cfg);
});

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: now(), version: '2.0.0' });
});

// ============================================================
// ── BACKUP DO BANCO DE DADOS ─────────────────────────────────
// ============================================================
app.get('/api/backup', auth(ADMIN), (req, res) => {
  const dbPath = process.env.DB_PATH || './data/nilotextil.db';
  if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'Banco não encontrado' });
  const filename = `nilotextil_backup_${new Date().toISOString().slice(0,10)}.db`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  const stream = fs.createReadStream(dbPath);
  stream.pipe(res);
  logAudit(req.user.id, 'export', 'backup', 'database', null, null, null, null, req);
});

// ============================================================
// ── HISTÓRICO DE PREÇO/KG POR TINTURARIA ─────────────────────
// ============================================================
app.get('/api/financeiro/historico-precos', auth(ALL), (req, res) => {
  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', l.created_at) as mes,
      t.nome as tinturaria,
      ROUND(SUM(l.custo_tinturaria) / NULLIF(SUM(l.peso_kg), 0), 2) as custo_kg,
      COUNT(*) as lotes,
      SUM(l.peso_kg) as kg_total
    FROM lotes l
    JOIN tinturarias t ON l.tinturaria_id = t.id
    WHERE l.custo_tinturaria > 0 AND l.peso_kg > 0
      AND l.created_at >= date('now', '-6 months')
    GROUP BY mes, t.id
    ORDER BY mes, t.nome
  `).all();

  // Organiza por tinturaria → array de meses
  const byTint = {};
  const meses = [...new Set(rows.map(r => r.mes))].sort();
  rows.forEach(r => {
    if (!byTint[r.tinturaria]) byTint[r.tinturaria] = {};
    byTint[r.tinturaria][r.mes] = { custo_kg: r.custo_kg, lotes: r.lotes, kg: r.kg_total };
  });

  res.json({ meses, tinturarias: byTint });
});

// ============================================================
// ── PERFORMANCE DAS TINTURARIAS ──────────────────────────────
// ============================================================
app.get('/api/tinturarias/performance', auth(ALL), (req, res) => {
  const rows = db.prepare(`
    SELECT
      t.nome,
      t.prazo_dias as prazo_prometido,
      COUNT(l.id) as total_lotes,
      SUM(CASE WHEN l.status = 'entregue' THEN 1 ELSE 0 END) as entregues,
      AVG(CASE
        WHEN l.status = 'entregue' AND l.data_envio_tinturaria IS NOT NULL AND l.updated_at IS NOT NULL
        THEN CAST((julianday(l.updated_at) - julianday(l.data_envio_tinturaria)) AS INTEGER)
        ELSE NULL END) as prazo_real_avg,
      SUM(CASE
        WHEN l.status = 'entregue' AND l.data_envio_tinturaria IS NOT NULL AND l.updated_at IS NOT NULL
          AND CAST((julianday(l.updated_at) - julianday(l.data_envio_tinturaria)) AS INTEGER) <= t.prazo_dias
        THEN 1 ELSE 0 END) as no_prazo,
      ROUND(AVG(CASE WHEN l.custo_tinturaria > 0 AND l.peso_kg > 0
        THEN l.custo_tinturaria / l.peso_kg ELSE NULL END), 2) as custo_kg_medio,
      SUM(l.peso_kg) as kg_total
    FROM tinturarias t
    LEFT JOIN lotes l ON l.tinturaria_id = t.id
      AND l.created_at >= date('now', '-6 months')
    WHERE t.ativo = 1
    GROUP BY t.id
    ORDER BY t.prioridade
  `).all().map(r => ({
    ...r,
    pct_pontualidade: r.entregues > 0 ? Math.round((r.no_prazo / r.entregues) * 100) : null,
    prazo_real_avg: r.prazo_real_avg ? Math.round(r.prazo_real_avg) : null,
    desvio_prazo: r.prazo_real_avg ? Math.round(r.prazo_real_avg - r.prazo_prometido) : null
  }));

  res.json(rows);
});

// ============================================================
// ── META MENSAL + PROGRESSO ──────────────────────────────────
// ============================================================
app.get('/api/meta-mensal', auth(ALL), (req, res) => {
  const cfg = {};
  db.prepare('SELECT key,value FROM config').all().forEach(r => { cfg[r.key] = Number(r.value); });
  const meta = cfg.meta_kg_mes || 34000;

  const mesAtual = new Date().toISOString().slice(0, 7);
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status NOT IN ('cancelado') THEN peso_kg ELSE 0 END), 0) as kg_em_producao,
      COALESCE(SUM(CASE WHEN status = 'entregue' THEN peso_kg ELSE 0 END), 0) as kg_entregue,
      COUNT(CASE WHEN status NOT IN ('cancelado') THEN 1 END) as lotes_ativos
    FROM lotes
    WHERE strftime('%Y-%m', created_at) = ?
  `).get(mesAtual);

  const pct = meta > 0 ? Math.min(100, Math.round((row.kg_em_producao / meta) * 100)) : 0;

  res.json({
    meta_kg: meta,
    kg_em_producao: Math.round(row.kg_em_producao),
    kg_entregue: Math.round(row.kg_entregue),
    lotes_ativos: row.lotes_ativos,
    pct_meta: pct,
    mes: mesAtual
  });
});

// ============================================================
// ── NOTIFICAÇÃO POR E-MAIL ───────────────────────────────────
// ============================================================
app.post('/api/notificar-atrasos', auth(ADMIN), async (req, res) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailTo   = process.env.EMAIL_TO || emailUser;

  if (!nodemailer) return res.status(503).json({ error: 'nodemailer não instalado no servidor' });
  if (!emailUser || !emailPass) {
    return res.status(503).json({ error: 'Configure EMAIL_USER e EMAIL_PASS nas variáveis de ambiente do Railway' });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const atrasados = db.prepare(`
    SELECT l.codigo, l.tipo, l.peso_kg, l.data_entrega_prevista,
           t.nome as tinturaria, l.status,
           CAST(julianday('now') - julianday(l.data_entrega_prevista) AS INTEGER) as dias_atraso
    FROM lotes l
    LEFT JOIN tinturarias t ON l.tinturaria_id = t.id
    WHERE l.status NOT IN ('entregue','cancelado')
      AND l.data_entrega_prevista < ?
    ORDER BY l.data_entrega_prevista ASC
  `).all(hoje);

  if (!atrasados.length) {
    return res.json({ enviado: false, msg: 'Nenhum lote atrasado — e-mail não enviado.' });
  }

  const linhas = atrasados.map(l =>
    `• ${l.codigo} (${l.tipo}) — ${l.peso_kg}kg — ${l.tinturaria || '?'} — ${l.dias_atraso}d de atraso`
  ).join('\n');

  const html = `
    <h2 style="color:#C83045">⚠ Alerta de Lotes Atrasados — Nilo Têxtil</h2>
    <p>Os seguintes lotes estão com entrega atrasada:</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
      <tr style="background:#f0f0f0"><th>Código</th><th>Tipo</th><th>Kg</th><th>Tinturaria</th><th>Previsão</th><th>Atraso</th></tr>
      ${atrasados.map(l => `<tr>
        <td><b>${l.codigo}</b></td>
        <td>${l.tipo}</td>
        <td>${l.peso_kg}</td>
        <td>${l.tinturaria || '—'}</td>
        <td style="color:#C83045">${l.data_entrega_prevista}</td>
        <td style="color:#C83045;font-weight:bold">${l.dias_atraso}d</td>
      </tr>`).join('')}
    </table>
    <p style="margin-top:20px;color:#666;font-size:12px">
      Acesse o sistema: <a href="${process.env.APP_URL || 'https://nilo-textil-api-production.up.railway.app'}">Nilo Têxtil — Gestão de Produção</a>
    </p>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });
    await transporter.sendMail({
      from: `"Nilo Têxtil Sistema" <${emailUser}>`,
      to: emailTo,
      subject: `⚠ ${atrasados.length} lote(s) atrasado(s) — Nilo Têxtil`,
      text: `Lotes atrasados:\n\n${linhas}`,
      html
    });
    logAudit(req.user.id, 'email', 'notificacao', 'atrasos', null, null, `${atrasados.length} lotes`, null, req);
    res.json({ enviado: true, lotes: atrasados.length, para: emailTo });
  } catch(e) {
    console.error('Email error:', e.message);
    res.status(500).json({ error: 'Falha ao enviar: ' + e.message });
  }
});

// ── Serve SPA for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Nilo Têxtil API rodando em http://localhost:${PORT}`);
  console.log(`   Banco de dados: ${process.env.DB_PATH || './data/nilotextil.db'}`);
  console.log(`   Modo: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
