import { NextResponse } from "next/server";

import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(
    `select id, sigla, nome, nome_curto as "nomeCurto", paroquia_id as "paroquiaId"
     from comunidades
     order by nome`,
  );

  return NextResponse.json(
    { comunidades: rows },
    // Dado público (sem cookie/sessão envolvida), então liberar CORS geral
    // aqui é seguro — facilita testar o app mobile no preview web também.
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
