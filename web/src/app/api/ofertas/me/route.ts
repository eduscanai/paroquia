import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { rows } = await pool.query(
    `select
       o.id,
       o.valor::float8 as valor,
       o.status,
       o.forma_pagamento as "formaPagamento",
       to_char(o.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as "criadoEm",
       to_char(o.confirmado_em, 'YYYY-MM-DD"T"HH24:MI:SS') as "confirmadoEm",
       c.titulo as "campanhaTitulo"
     from ofertas o
     left join campanhas c on c.id = o.campanha_id
     where o.user_id = $1
     order by o.created_at desc`,
    [session.user.id],
  );

  return NextResponse.json({ ofertas: rows });
}
