import { config } from "dotenv";

config({ path: ".env.local" });

const EMAIL = process.env.SEED_PAROQUIA_EMAIL ?? "paroquia@paroquia.com.br";
const PASSWORD = process.env.SEED_PAROQUIA_PASSWORD ?? "senha123456";
const NAME = process.env.SEED_PAROQUIA_NAME ?? "Secretaria da Paróquia";

async function main() {
  const { auth } = await import("@/lib/auth");
  const { pool } = await import("@/lib/db");

  const { rows: existentes } = await pool.query(`select id from "user" where email = $1`, [
    EMAIL,
  ]);
  if (existentes.length > 0) {
    console.log(`Conta ${EMAIL} já existe — nada foi criado.`);
    await pool.end();
    return;
  }

  await auth.api.signUpEmail({
    body: { email: EMAIL, password: PASSWORD, name: NAME },
  });

  await pool.query(`update "user" set role = 'paroquia' where email = $1`, [EMAIL]);

  await pool.end();
  console.log(`Conta de paróquia criada: ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Falha ao criar a conta de paróquia:", error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
