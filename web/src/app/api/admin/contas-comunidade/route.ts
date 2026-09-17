import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (session.user.role !== "paroquia" && session.user.role !== "desenvolvedor") {
    return NextResponse.json(
      { error: "Apenas contas de nível paróquia podem criar contas de comunidade." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { nome, email, senha, comunidadeId } = body as Record<string, string>;
  const camposFaltando = ["nome", "email", "senha", "comunidadeId"].filter(
    (campo) => !body[campo] || typeof body[campo] !== "string",
  );
  if (camposFaltando.length > 0) {
    return NextResponse.json(
      { error: `Campos obrigatórios faltando: ${camposFaltando.join(", ")}.` },
      { status: 400 },
    );
  }

  const { rows: comunidadeRows } = await pool.query(`select id from comunidades where id = $1`, [
    comunidadeId,
  ]);
  if (comunidadeRows.length === 0) {
    return NextResponse.json({ error: "Comunidade inválida." }, { status: 400 });
  }

  const { rows: jaVinculada } = await pool.query(
    `select id from comunidade_admins where comunidade_id = $1`,
    [comunidadeId],
  );
  if (jaVinculada.length > 0) {
    return NextResponse.json(
      { error: "Esta comunidade já tem uma conta de administração vinculada." },
      { status: 400 },
    );
  }

  // Mesma cautela do endpoint de fiéis: não repassa o Set-Cookie da conta
  // recém-criada, pra não trocar a sessão de quem está preenchendo o form.
  let authResponse: Response;
  try {
    authResponse = await auth.api.signUpEmail({
      body: { email, password: senha, name: nome },
      asResponse: true,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao criar a conta." }, { status: 500 });
  }

  if (!authResponse.ok) {
    const err = await authResponse.json().catch(() => ({ message: "Erro ao criar a conta." }));
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar a conta." },
      { status: authResponse.status },
    );
  }

  const { user } = await authResponse.json();

  try {
    await pool.query(`update "user" set role = 'comunidade' where id = $1`, [user.id]);
    await pool.query(
      `insert into comunidade_admins (user_id, comunidade_id) values ($1, $2)`,
      [user.id, comunidadeId],
    );
  } catch (error) {
    await pool.query(`delete from "user" where id = $1`, [user.id]).catch(() => {});
    return NextResponse.json(
      { error: `Erro ao vincular a conta: ${(error as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
