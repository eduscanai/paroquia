"use client";

import { useRouter } from "next/navigation";
import { Pencil, Pin, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Paginacao } from "./paginacao";
import type { Aviso, Comunidade } from "./types";
import { usePaginacao } from "./use-paginacao";

const POR_PAGINA = 6;

export function AvisosSection({
  comunidades,
  avisos,
  carregando,
  onAlterado,
}: {
  comunidades: Comunidade[];
  avisos: Aviso[];
  carregando: boolean;
  onAlterado: () => void;
}) {
  const router = useRouter();

  const { itensPagina, pagina, totalPaginas, total, proxima, anterior } = usePaginacao(
    avisos,
    POR_PAGINA,
  );

  async function handleExcluir(aviso: Aviso) {
    if (!window.confirm(`Excluir o aviso "${aviso.titulo}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    const res = await fetch(`/api/avisos/${aviso.id}`, { method: "DELETE" });
    if (res.ok) {
      onAlterado();
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Avisos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publicados para{" "}
            {comunidades.length === 1 ? comunidades[0].nomeCurto : "toda a paróquia"}
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/avisos/novo")}
          className="h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus />
          Novo aviso
        </Button>
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : avisos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum aviso publicado ainda.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {itensPagina.map((aviso) => (
            <li key={aviso.id} className="flex overflow-hidden rounded-2xl bg-muted/60">
              <div className="w-1 bg-primary" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {comunidades.length > 1 ? (
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {aviso.comunidadeNomeCurto}
                      </span>
                    ) : null}
                    {aviso.fixado ? (
                      <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                        <Pin size={12} strokeWidth={2} />
                        Fixado
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {aviso.data} às {aviso.hora}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar aviso"
                      onClick={() => router.push(`/dashboard/avisos/${aviso.id}`)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir aviso"
                      onClick={() => handleExcluir(aviso)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <p className="text-lg font-bold text-foreground">{aviso.titulo}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{aviso.descricao}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!carregando && avisos.length > 0 ? (
        <Paginacao
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          porPagina={POR_PAGINA}
          onAnterior={anterior}
          onProxima={proxima}
        />
      ) : null}
    </section>
  );
}
