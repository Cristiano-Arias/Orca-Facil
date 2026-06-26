// Cria/atualiza as tabelas no banco antes de o app subir.
// Roda no "start" (Render) e pode ser rodado manualmente com: npm run migrate
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "..", "src", "lib", "schema.sql"), "utf8");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definido — pulando migração.");
  process.exit(0);
}
const precisaSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
const client = new pg.Client({
  connectionString,
  ssl: precisaSsl ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  await client.query(sql);
  console.log("✓ Banco pronto (tabelas verificadas).");
} catch (e) {
  console.error("Falha na migração:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
