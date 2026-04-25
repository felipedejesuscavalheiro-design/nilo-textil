// ============================================================
// db.js — SQLite Schema, Migrations & Seed
// Nilo Têxtil — Sistema de Gestão de Produção
// ============================================================
'use strict';

const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'nilotextil.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// ── WAL mode for better concurrent reads ──────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// SCHEMA MIGRATIONS
// ============================================================
function migrate() {
  db.exec(`
    -- ─── USERS ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'visualizador',
      -- role: admin | gerente | visualizador
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      last_login    TEXT
    );

    -- ─── TECELAGENS ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tecelagens (
      id            TEXT PRIMARY KEY,
      nome          TEXT NOT NULL,
      capacidade_kg REAL NOT NULL DEFAULT 0,
      prazo_dias    INTEGER NOT NULL DEFAULT 30,
      tipo          TEXT NOT NULL DEFAULT 'ambos',
      -- tipo: PT | LISO | ambos
      contato       TEXT DEFAULT '',
      telefone      TEXT DEFAULT '',
      email         TEXT DEFAULT '',
      observacoes   TEXT DEFAULT '',
      ativo         INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      created_by    TEXT REFERENCES users(id)
    );

    -- ─── TINTURARIAS ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tinturarias (
      id            TEXT PRIMARY KEY,
      nome          TEXT NOT NULL,
      capacidade_kg REAL NOT NULL DEFAULT 0,
      prazo_dias    INTEGER NOT NULL DEFAULT 45,
      tipo          TEXT NOT NULL DEFAULT 'ambos',
      -- tipo: PT | LISO | ambos
      prioridade    INTEGER NOT NULL DEFAULT 1,
      contato       TEXT DEFAULT '',
      telefone      TEXT DEFAULT '',
      email         TEXT DEFAULT '',
      custo_por_kg  REAL NOT NULL DEFAULT 0,
      observacoes   TEXT DEFAULT '',
      ativo         INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      created_by    TEXT REFERENCES users(id)
    );

    -- ─── LOTES ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS lotes (
      id                       TEXT PRIMARY KEY,
      codigo                   TEXT UNIQUE NOT NULL,
      tipo                     TEXT NOT NULL,
      -- tipo: PT | LISO
      peso_kg                  REAL NOT NULL,
      cor                      TEXT DEFAULT '',
      referencia               TEXT DEFAULT '',
      tecelagem_id             TEXT REFERENCES tecelagens(id),
      tinturaria_id            TEXT REFERENCES tinturarias(id),
      status                   TEXT NOT NULL DEFAULT 'fio',
      -- status: fio | tecelagem | tinturaria | pronto | entregue | cancelado
      data_envio_tecelagem     TEXT,
      data_prevista_tecelagem  TEXT,
      data_envio_tinturaria    TEXT,
      data_prevista_tinturaria TEXT,
      data_entrega_prevista    TEXT,
      data_entrega_real        TEXT,
      custo_tecelagem          REAL DEFAULT 0,
      custo_tinturaria         REAL DEFAULT 0,
      custo_frete              REAL DEFAULT 0,
      custo_total              REAL DEFAULT 0,
      notas                    TEXT DEFAULT '',
      created_at               TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at               TEXT NOT NULL DEFAULT (datetime('now')),
      created_by               TEXT REFERENCES users(id),
      updated_by               TEXT REFERENCES users(id)
    );

    -- ─── AUDIT LOG ───────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      entity_name TEXT,
      action      TEXT NOT NULL,
      -- action: create | update | delete | status_change | login | logout
      field_name  TEXT,
      old_value   TEXT,
      new_value   TEXT,
      user_id     TEXT,
      user_name   TEXT,
      ip_address  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─── NOTIFICATIONS ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo       TEXT NOT NULL,
      -- tipo: atraso | estoque_baixo | entrega_proxima
      mensagem   TEXT NOT NULL,
      lote_id    TEXT REFERENCES lotes(id),
      lida       INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─── CONFIG ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS config (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      label      TEXT,
      tipo       TEXT DEFAULT 'number',
      updated_at TEXT DEFAULT (datetime('now')),
      updated_by TEXT
    );

    -- ─── INDEXES ─────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_lotes_status      ON lotes(status);
    CREATE INDEX IF NOT EXISTS idx_lotes_tipo        ON lotes(tipo);
    CREATE INDEX IF NOT EXISTS idx_lotes_tinturaria  ON lotes(tinturaria_id);
    CREATE INDEX IF NOT EXISTS idx_lotes_tecelagem   ON lotes(tecelagem_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity      ON audit_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_lida ON notifications(lida);
  `);
}

// ============================================================
// SEED DATA
// ============================================================
function seed() {
  // ── Default Admin ──
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'Administrador',
      'admin@nilotextil.com.br',
      bcrypt.hashSync('Nilo@2024', 10),
      'admin'
    );
    console.log('✓ Usuário admin criado: admin@nilotextil.com.br / Nilo@2024');
  }

  // ── Default Config ──
  const configRows = [
    { key: 'consumo_mensal_pt',   value: '13200', label: 'Consumo mensal PT (kg)',       tipo: 'number' },
    { key: 'consumo_mensal_liso', value: '20800', label: 'Consumo mensal LISO (kg)',     tipo: 'number' },
    { key: 'buffer_dias',         value: '15',    label: 'Buffer de estoque (dias)',      tipo: 'number' },
    { key: 'alerta_atraso_dias',  value: '3',     label: 'Alertar atraso após (dias)',   tipo: 'number' },
  ];
  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO config (key, value, label, tipo) VALUES (?,?,?,?)
  `);
  configRows.forEach(r => insertConfig.run(r.key, r.value, r.label, r.tipo));

  // ── Default Tecelagens ──
  const tecExists = db.prepare('SELECT id FROM tecelagens LIMIT 1').get();
  if (!tecExists) {
    const adminId = db.prepare('SELECT id FROM users WHERE role = ?').get('admin').id;
    const insertTec = db.prepare(`
      INSERT INTO tecelagens (id, nome, capacidade_kg, prazo_dias, tipo, ativo, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    [
      { nome: 'Libélula',       cap: 5000,  prazo: 25, tipo: 'PT',    ativo: 1 },
      { nome: 'OTL',            cap: 10000, prazo: 30, tipo: 'ambos', ativo: 1 },
      { nome: 'Lope & Krieger', cap: 2000,  prazo: 30, tipo: 'ambos', ativo: 1 },
      { nome: 'Prime',          cap: 10000, prazo: 30, tipo: 'LISO',  ativo: 0 },
    ].forEach(t => insertTec.run(uuidv4(), t.nome, t.cap, t.prazo, t.tipo, t.ativo, adminId));

    const insertTint = db.prepare(`
      INSERT INTO tinturarias (id, nome, capacidade_kg, prazo_dias, tipo, prioridade, custo_por_kg, ativo, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [
      { nome: 'Staack',    cap: 14400, prazo: 45, tipo: 'ambos', prio: 1, custo: 4.5  },
      { nome: 'Assini',    cap: 6400,  prazo: 40, tipo: 'LISO',  prio: 2, custo: 4.2  },
      { nome: 'Mar Têxtil',cap: 800,   prazo: 40, tipo: 'LISO',  prio: 3, custo: 4.0  },
      { nome: 'Unitex',    cap: 1200,  prazo: 42, tipo: 'PT',    prio: 2, custo: 4.8  },
    ].forEach(t => insertTint.run(uuidv4(), t.nome, t.cap, t.prazo, t.tipo, t.prio, t.custo, 1, adminId));

    console.log('✓ Fornecedores padrão inseridos');
  }
}

migrate();
seed();

module.exports = db;
