import { config } from "dotenv";

config({ path: ".env.local" });

const EMAIL = process.env.SEED_DIZIMISTA_EMAIL ?? "barbosa.filipe@outlook.com.br";
const DIA_VENCIMENTO = Number(process.env.SEED_DIZIMISTA_DIA_VENCIMENTO ?? 10);
const VALOR_MENSAL = Number(process.env.SEED_DIZIMISTA_VALOR_MENSAL ?? 150);

async function main() {
  const { pool } = await import("@/lib/db");

  const { rows: userRows } = await pool.query(`select id from "user" where email = $1`, [EMAIL]);
  if (userRows.length === 0) {
    throw new Error(`Usuário ${EMAIL} não encontrado.`);
  }
  const userId = userRows[0].id;

  const { rows: fielRows } = await pool.query(
    `select comunidade_id from fieis where user_id = $1`,
    [userId],
  );
  if (fielRows.length === 0) {
    throw new Error(`Usuário ${EMAIL} não tem cadastro de fiel (comunidade).`);
  }
  const comunidadeId = fielRows[0].comunidade_id;

  const { rows: existentes } = await pool.query(`select id from dizimistas where user_id = $1`, [
    userId,
  ]);
  if (existentes.length > 0) {
    console.log(`${EMAIL} já é dizimista — nada foi criado.`);
    await pool.end();
    return;
  }

  await pool.query(
    `insert into dizimistas (user_id, comunidade_id, dia_vencimento, valor_mensal)
     values ($1, $2, $3, $4)`,
    [userId, comunidadeId, DIA_VENCIMENTO, VALOR_MENSAL],
  );

  await pool.end();
  console.log(`Dizimista criado para ${EMAIL}: vencimento dia ${DIA_VENCIMENTO}, R$ ${VALOR_MENSAL}/mês.`);
}

main()
  .catch((error) => {
    console.error("Falha ao criar dizimista:", error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
