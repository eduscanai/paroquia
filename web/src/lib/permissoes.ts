import { pool } from "@/lib/db";

export async function podeGerenciarComunidade(
  userId: string,
  role: string,
  comunidadeId: string | null,
): Promise<boolean> {
  if (role === "desenvolvedor" || role === "paroquia") return true;
  if (role !== "comunidade" || !comunidadeId) return false;

  const { rows } = await pool.query(
    `select 1 from comunidade_admins where user_id = $1 and comunidade_id = $2`,
    [userId, comunidadeId],
  );
  return rows.length > 0;
}
