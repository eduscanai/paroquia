import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { nome, sobrenome, email, senha, dataNascimento, comunidadeId, endereco } = body as Record<
    string,
    string
  >;

  const camposFaltando = ["nome", "sobrenome", "email", "senha", "dataNascimento", "comunidadeId", "endereco"].filter(
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
    return NextResponse.json({ error: err.message ?? "Erro ao criar a conta." }, {
      status: authResponse.status,
    });
  }

  const { user } = await authResponse.clone().json();

  try {
    await pool.query(
      `insert into fieis (user_id, sobrenome, data_nascimento, comunidade_id, endereco)
       values ($1, $2, $3, $4, $5)`,
      [user.id, sobrenome, dataNascimento, comunidadeId, endereco],
    );
  } catch (error) {
    // Compensação: se o perfil de fiel não pôde ser criado, não deixa um
    // usuário de autenticação órfão pra trás. (auth.api.deleteUser exige uma
    // sessão ativa do próprio usuário, então removemos direto via SQL.)
    await pool.query(`delete from "user" where id = $1`, [user.id]).catch(() => {});
    return NextResponse.json(
      { error: `Erro ao salvar o perfil: ${(error as Error).message}` },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ user });
  const setCookie = authResponse.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
