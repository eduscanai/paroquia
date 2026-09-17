import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import { config } from "dotenv";

config({ path: ".env.local" });

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

async function main() {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows: applied } = await pool.query<{ name: string }>(`select name from _migrations`);
  const appliedNames = new Set(applied.map((r) => r.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ranAny = false;

  for (const file of files) {
    if (appliedNames.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`Aplicando ${file}...`);

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(`insert into _migrations (name) values ($1)`, [file]);
      await client.query("commit");
      console.log(`  ✓ ${file}`);
      ranAny = true;
    } catch (error) {
      await client.query("rollback");
      throw new Error(`Falha em ${file}: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  if (!ranAny) {
    console.log("Nada para migrar — todas as migrações já foram aplicadas.");
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
