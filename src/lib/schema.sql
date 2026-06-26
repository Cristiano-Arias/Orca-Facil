-- OrçaChat — estrutura do banco (idempotente).
-- Multi-tenant: todo dado pertence a uma organization.
-- As tabelas ficam num schema próprio ("orcafacil") para conviver, sem conflito,
-- com outros projetos que compartilhem o mesmo banco PostgreSQL.

CREATE SCHEMA IF NOT EXISTS orcafacil;

CREATE TABLE IF NOT EXISTS orcafacil.organization (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcafacil.app_user (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  senha_hash  TEXT NOT NULL,
  nome        TEXT NOT NULL,
  org_id      TEXT NOT NULL REFERENCES orcafacil.organization(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcafacil.profile (
  org_id          TEXT PRIMARY KEY REFERENCES orcafacil.organization(id) ON DELETE CASCADE,
  nome_comercial  TEXT,
  responsavel     TEXT,
  telefone        TEXT,
  email           TEXT,
  documento       TEXT,
  endereco        TEXT,
  pix             TEXT,
  logo_data_url   TEXT,
  validade_padrao INT NOT NULL DEFAULT 7,
  modelo          TEXT NOT NULL DEFAULT 'profissional',
  cor             TEXT NOT NULL DEFAULT '#4f46e5',
  whatsapp        TEXT
);

-- colunas adicionadas em bancos já existentes (idempotente)
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS cor TEXT NOT NULL DEFAULT '#4f46e5';
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS whatsapp TEXT;

CREATE TABLE IF NOT EXISTS orcafacil.client (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES orcafacil.organization(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  email       TEXT,
  endereco    TEXT,
  obs         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcafacil.service (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL REFERENCES orcafacil.organization(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  unidade         TEXT NOT NULL DEFAULT 'un',
  preco_padrao    DOUBLE PRECISION NOT NULL DEFAULT 0,
  custo_padrao    DOUBLE PRECISION NOT NULL DEFAULT 0,
  garantia_padrao TEXT,
  historico       DOUBLE PRECISION[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcafacil.proposal (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES orcafacil.organization(id) ON DELETE CASCADE,
  numero        TEXT NOT NULL,
  client_id     TEXT REFERENCES orcafacil.client(id) ON DELETE SET NULL,
  servico_base  TEXT,
  status        TEXT NOT NULL DEFAULT 'RASCUNHO',
  prazo         TEXT,
  pagamento     TEXT,
  garantia      TEXT,
  validade_dias INT NOT NULL DEFAULT 7,
  desconto      DOUBLE PRECISION NOT NULL DEFAULT 0,
  obs           TEXT,
  nota_cliente  TEXT,
  emitido_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, numero)
);

-- garante a coluna de nota do cliente em bancos já existentes (idempotente)
ALTER TABLE orcafacil.proposal ADD COLUMN IF NOT EXISTS nota_cliente TEXT;

CREATE TABLE IF NOT EXISTS orcafacil.proposal_item (
  id          TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES orcafacil.proposal(id) ON DELETE CASCADE,
  descricao   TEXT NOT NULL,
  qtd         DOUBLE PRECISION NOT NULL DEFAULT 1,
  unidade     TEXT NOT NULL DEFAULT 'un',
  preco       DOUBLE PRECISION NOT NULL DEFAULT 0,
  custo       DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orcafacil.payment (
  id          TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES orcafacil.proposal(id) ON DELETE CASCADE,
  valor       DOUBLE PRECISION NOT NULL,
  forma       TEXT,
  data        TIMESTAMPTZ NOT NULL DEFAULT now()
);
