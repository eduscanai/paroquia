import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { podeGerenciarComunidade } from "@/lib/permissoes";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { rows } = await pool.query(
    `select
       c.id,
       c.comunidade_id as "comunidadeId",
       co.nome as "comunidadeNome",
       co.nome_curto as "comunidadeNomeCurto",
       c.titulo,
       c.descricao,
       c.meta::float8 as meta,
       c.arrecadado::float8 as arrecadado,
       c.ativa,
       c.priorizada,
       coalesce((
         select sum(o.valor) from ofertas o
         where o.campanha_credito_id = c.id and o.campanha_id is null and o.status = 'confirmado'
       ), 0)::float8 as "doacoesSemDirecionamento"
     from campanhas c
     left join comunidades co on co.id = c.comunidade_id
     order by c.ativa desc, c.created_at desc`,
  );

  // "totalNaoCreditado" é a parte de doações sem direcionamento que ainda não
  // foi somada ao arrecadado de nenhuma campanha (confirmadas sem nenhuma
  // campanha priorizada na hora) — usado pra não contar duas vezes o que já
  // está dentro de campanha.arrecadado.
  const { rows: semDirecionamentoRows } = await pool.query(
    `select
       coalesce(sum(valor), 0)::float8 as total,
       count(*)::int as quantidade,
       coalesce(sum(valor) filter (where campanha_credito_id is null), 0)::float8 as "totalNaoCreditado",
       count(*) filter (where campanha_credito_id is null)::int as "quantidadeNaoCreditada"
     from ofertas
     where campanha_id is null and status = 'confirmado'`,
  );

  return NextResponse.json({
    campanhas: rows,
    semDirecionamento: semDirecionamentoRows[0],
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    (body.comunidadeId !== null && typeof body.comunidadeId !== "string") ||
    typeof body.titulo !== "string" ||
    typeof body.descricao !== "string" ||
    typeof body.meta !== "number" ||
    !body.titulo.trim() ||
    !body.descricao.trim() ||
    !(body.meta > 0)
  ) {
    return NextResponse.json(
      { error: "Campos obrigatórios: comunidadeId, titulo, descricao, meta (> 0)." },
      { status: 400 },
    );
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    body.comunidadeId,
  );
  if (!permitido) {
    return NextResponse.json(
      { error: "Sem permissão para criar campanhas nesta comunidade." },
      { status: 403 },
    );
  }

  const priorizada = typeof body.priorizada === "boolean" ? body.priorizada : false;
  if (priorizada && session.user.role !== "paroquia" && session.user.role !== "desenvolvedor") {
    return NextResponse.json(
      { error: "Apenas contas de nível paróquia podem priorizar uma campanha." },
      { status: 403 },
    );
  }

  const arrecadado = typeof body.arrecadado === "number" && body.arrecadado >= 0 ? body.arrecadado : 0;
  const ativa = typeof body.ativa === "boolean" ? body.ativa : true;

  const client = await pool.connect();
  try {
    await client.query("begin");
    if (priorizada) {
      await client.query(`update campanhas set priorizada = false where priorizada = true`);
    }
    const { rows } = await client.query(
      `insert into campanhas (comunidade_id, titulo, descricao, meta, arrecadado, ativa, priorizada)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id`,
      [body.comunidadeId || null, body.titulo, body.descricao, body.meta, arrecadado, ativa, priorizada],
    );
    await client.query("commit");
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
