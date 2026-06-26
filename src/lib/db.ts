import { Pool } from "pg";

// Pool de conexões PostgreSQL, criado sob demanda e reaproveitado.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function getPool(): Pool {
  if (globalForDb.pgPool) return globalForDb.pgPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não definido");
  // No Render (e na maioria dos provedores gerenciados) a conexão usa SSL.
  const precisaSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({
    connectionString,
    ssl: precisaSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
    // Usa o schema próprio do OrçaChat (isola de outros projetos no mesmo banco).
    options: "-c search_path=orcafacil,public",
  });
  globalForDb.pgPool = pool;
  return pool;
}

// Executa uma query parametrizada e devolve as linhas.
export async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query(sql, params);
  return res.rows as T[];
}

export async function uma<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}
