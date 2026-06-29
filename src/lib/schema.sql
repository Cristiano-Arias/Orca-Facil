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
  whatsapp        TEXT,
  logo_fundo      TEXT NOT NULL DEFAULT 'branco',
  logo_formato    TEXT NOT NULL DEFAULT 'quadrado',
  logo_emoji      TEXT,
  pagamento_padrao TEXT,
  garantia_padrao  TEXT,
  prazo_padrao     TEXT,
  obs_padrao       TEXT,
  onboarded        BOOLEAN NOT NULL DEFAULT false
);

-- colunas adicionadas em bancos já existentes (idempotente)
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS cor TEXT NOT NULL DEFAULT '#4f46e5';
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS logo_fundo TEXT NOT NULL DEFAULT 'branco';
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS logo_formato TEXT NOT NULL DEFAULT 'quadrado';
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS logo_emoji TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS pagamento_padrao TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS garantia_padrao TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS prazo_padrao TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS obs_padrao TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;
-- assinatura / cobrança (Mercado Pago)
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS plano TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS assinatura_status TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT;
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS assinatura_ate TIMESTAMPTZ;
-- fim do período de teste grátis (quando há cartão cadastrado via Mercado Pago)
ALTER TABLE orcafacil.profile ADD COLUMN IF NOT EXISTS trial_ate TIMESTAMPTZ;

-- Configuração dos planos, editável pelo dono no Painel do Dono.
-- Se um plano não estiver aqui, vale o padrão do código (src/lib/billing.ts).
CREATE TABLE IF NOT EXISTS orcafacil.plan_config (
  chave     TEXT PRIMARY KEY,          -- 'inicial' | 'profissional' | 'ilimitado'
  nome      TEXT NOT NULL,
  preco     DOUBLE PRECISION NOT NULL,
  cota      INTEGER,                   -- NULL = ilimitado
  recursos  JSONB NOT NULL DEFAULT '[]',
  ordem     INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- memória de conversa do WhatsApp (para perguntar o que falta, passo a passo)
CREATE TABLE IF NOT EXISTS orcafacil.wa_session (
  org_id        TEXT NOT NULL,
  sender        TEXT NOT NULL,
  campos        JSONB NOT NULL DEFAULT '{}',
  etapa         TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, sender)
);

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
