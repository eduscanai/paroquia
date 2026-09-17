import { config } from "dotenv";

config({ path: ".env.local" });

const EMAIL = process.env.SEED_COMUNIDADE_EMAIL ?? "matriz@paroquia.com.br";
const PASSWORD = process.env.SEED_COMUNIDADE_PASSWORD ?? "senha123456";
const NAME = process.env.SEED_COMUNIDADE_NAME ?? "Secretaria Matriz Santo Antônio";
const SIGLA = process.env.SEED_COMUNIDADE_SIGLA ?? "MA";

async function main() {
  const { auth } = await import("@/lib/auth");
  const { pool } = await import("@/lib/db");

  const { rows: existentes } = await pool.query(`select id from "user" where email = $1`, [EMAIL]);
  if (existentes.length > 0) {
    console.log(`Conta ${EMAIL} já existe — nada foi criado.`);
    await pool.end();
    return;
  }

  const { rows: comunidadeRows } = await pool.query(
    `select id, nome from comunidades where sigla = $1`,
    [SIGLA],
  );
  if (comunidadeRows.length === 0) {
    throw new Error(`Comunidade de sigla "${SIGLA}" não encontrada.`);
  }

  await auth.api.signUpEmail({
    body: { email: EMAIL, password: PASSWORD, name: NAME },
  });

  const { rows: userRows } = await pool.query(`select id from "user" where email = $1`, [EMAIL]);
  const userId = userRows[0].id;

  await pool.query(`update "user" set role = 'comunidade' where id = $1`, [userId]);
  await pool.query(
    `insert into comunidade_admins (user_id, comunidade_id) values ($1, $2)`,
    [userId, comunidadeRows[0].id],
  );

  await pool.end();
  console.log(
    `Conta de comunidade criada: ${EMAIL} / ${PASSWORD} (vinculada a "${comunidadeRows[0].nome}")`,
  );
}

main()
  .catch((error) => {
    console.error("Falha ao criar a conta de comunidade:", error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
