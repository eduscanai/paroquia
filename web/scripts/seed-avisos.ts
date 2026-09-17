import { config } from "dotenv";

config({ path: ".env.local" });

const AVISOS_EXEMPLO = [
  {
    comunidadeSigla: "MA",
    diasAtras: 2,
    fixado: true,
    titulo: "Festa de Santo Antônio: missa solene no dia 13",
    descricao:
      "A missa solene do padroeiro será às 19h, na Matriz, com a presença do bispo diocesano. Depois da missa tem quermesse no pátio, com barraca de comida e leilão de prendas. Quem quiser doar prenda pode deixar na secretaria até o dia 11.",
    imagemUrl: "https://picsum.photos/seed/santo-antonio/800/500",
  },
  {
    comunidadeSigla: "MA",
    diasAtras: 5,
    fixado: true,
    titulo: "Inscrições abertas para a catequese de 2027",
    descricao:
      "As inscrições vão até 20 de setembro, na secretaria, de terça a sexta, das 8h às 17h. Traga a certidão de nascimento e uma foto 3x4.",
    imagemUrl: null,
  },
  {
    comunidadeSigla: "SP",
    diasAtras: 1,
    fixado: false,
    titulo: "Coleta de alimentos para as famílias do bairro",
    descricao:
      "Neste mês recolhemos arroz, feijão, óleo e leite em pó. Deixe a doação na cesta ao lado da porta principal, em qualquer horário de missa.",
    imagemUrl: null,
  },
  {
    comunidadeSigla: "NF",
    diasAtras: 8,
    fixado: false,
    titulo: "Mutirão de limpeza no salão paroquial",
    descricao:
      "Precisamos de voluntários no sábado pela manhã para organizar o salão antes da festa. Traga luvas e disposição.",
    imagemUrl: null,
  },
  {
    comunidadeSigla: "SR",
    diasAtras: 3,
    fixado: false,
    titulo: "Terço dos homens muda de horário",
    descricao:
      "A partir deste mês, o terço dos homens passa a ser às 19h30, antes era 20h. O local continua o mesmo, na capela lateral.",
    imagemUrl: null,
  },
];

async function main() {
  const { pool } = await import("@/lib/db");

  const { rows: existentes } = await pool.query(`select count(*) from avisos`);
  if (Number(existentes[0].count) > 0) {
    console.log("A tabela avisos já tem dados — nada foi inserido (rode só em banco vazio).");
    await pool.end();
    return;
  }

  const { rows: comunidades } = await pool.query(`select id, sigla from comunidades`);
  const comunidadeIdPorSigla = new Map(comunidades.map((c) => [c.sigla, c.id]));

  const { rows: autores } = await pool.query(
    `select id from "user" where email = 'admin@paroquia.com.br' limit 1`,
  );
  const autorId = autores[0]?.id ?? null;

  for (const aviso of AVISOS_EXEMPLO) {
    const comunidadeId = comunidadeIdPorSigla.get(aviso.comunidadeSigla);
    if (!comunidadeId) {
      console.warn(`Comunidade ${aviso.comunidadeSigla} não encontrada, pulando "${aviso.titulo}".`);
      continue;
    }

    await pool.query(
      `insert into avisos (comunidade_id, autor_id, titulo, descricao, imagem_url, fixado, publicado_em)
       values ($1, $2, $3, $4, $5, $6, now() - ($7 || ' days')::interval)`,
      [
        comunidadeId,
        autorId,
        aviso.titulo,
        aviso.descricao,
        aviso.imagemUrl,
        aviso.fixado,
        aviso.diasAtras,
      ],
    );
    console.log(`✓ ${aviso.titulo}`);
  }

  await pool.end();
  console.log(`\n${AVISOS_EXEMPLO.length} aviso(s) inserido(s).`);
}

main().catch((error) => {
  console.error("Falha ao popular avisos:", error?.message ?? error);
  process.exitCode = 1;
});
