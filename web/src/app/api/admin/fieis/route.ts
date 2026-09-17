import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { podeGerenciarComunidade } from "@/lib/permissoes";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { nome, sobrenome, email, senha, dataNascimento, comunidadeId, endereco } = body as Record<
    string,
    string
  >;

  const camposFaltando = [
    "nome",
    "sobrenome",
    "email",
    "senha",
    "dataNascimento",
    "comunidadeId",
    "endereco",
  ].filter((campo) => !body[campo] || typeof body[campo] !== "string");
  if (camposFaltando.length > 0) {
    return NextResponse.json(
      { error: `Campos obrigatórios faltando: ${camposFaltando.join(", ")}.` },
      { status: 400 },
    );
  }

  const permitido = await podeGerenciarComunidade(session.user.id, session.user.role, comunidadeId);
  if (!permitido) {
    return NextResponse.json(
      { error: "Sem permissão para cadastrar fiéis nesta comunidade." },
      { status: 403 },
    );
  }

  const { rows: comunidadeRows } = await pool.query(`select id from comunidades where id = $1`, [
    comunidadeId,
  ]);
  if (comunidadeRows.length === 0) {
    return NextResponse.json({ error: "Comunidade inválida." }, { status: 400 });
  }

  // Cria a conta sem repassar o Set-Cookie da resposta — isso é uma conta
  // criada por um admin já logado, não deve trocar a sessão de quem está
  // preenchendo o formulário.
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
    await pool.query(
      `insert into fieis (user_id, sobrenome, data_nascimento, comunidade_id, endereco)
       values ($1, $2, $3, $4, $5)`,
      [user.id, sobrenome, dataNascimento, comunidadeId, endereco],
    );
  } catch (error) {
    await pool.query(`delete from "user" where id = $1`, [user.id]).catch(() => {});
    return NextResponse.json(
      { error: `Erro ao salvar o perfil: ${(error as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
