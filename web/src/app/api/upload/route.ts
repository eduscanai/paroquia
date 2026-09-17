import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const arquivo = form?.get("file");
  if (!arquivo || !(arquivo instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const extensao = EXTENSAO_POR_TIPO[arquivo.type];
  if (!extensao) {
    return NextResponse.json(
      { error: "Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF." },
      { status: 400 },
    );
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return NextResponse.json(
      { error: "A imagem precisa ter no máximo 5 MB." },
      { status: 400 },
    );
  }

  const nomeArquivo = `${randomUUID()}.${extensao}`;
  const pastaUploads = path.join(process.cwd(), "public", "uploads");
  await mkdir(pastaUploads, { recursive: true });
  await writeFile(
    path.join(pastaUploads, nomeArquivo),
    Buffer.from(await arquivo.arrayBuffer()),
  );

  // Usa o endereço de rede local configurado (mesmo host que o app mobile
  // usa pra falar com o servidor), não o host da requisição — senão uma
  // imagem enviada via navegador em "localhost" ficaria inacessível pelo
  // celular.
  const origem = process.env.NEXT_PUBLIC_APP_ORIGIN || req.nextUrl.origin;
  const url = new URL(`/uploads/${nomeArquivo}`, origem).toString();
  return NextResponse.json({ url }, { status: 201 });
}
