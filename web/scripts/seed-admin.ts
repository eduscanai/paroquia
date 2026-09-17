import { config } from "dotenv";

config({ path: ".env.local" });

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@paroquia.com.br";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "senha123456";
const NAME = process.env.SEED_ADMIN_NAME ?? "Administrador";

async function main() {
  const { auth } = await import("@/lib/auth");
  const { Pool } = await import("pg");

  await auth.api.signUpEmail({
    body: {
      email: EMAIL,
      password: PASSWORD,
      name: NAME,
    },
  });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`update "user" set role = 'desenvolvedor' where email = $1`, [EMAIL]);
  await pool.end();

  console.log(`Usuário admin criado (role: desenvolvedor): ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Falha ao criar o admin:", error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
