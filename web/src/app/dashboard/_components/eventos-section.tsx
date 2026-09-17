"use client";

import { useRouter } from "next/navigation";
import { Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Paginacao } from "./paginacao";
import type { Comunidade, Evento } from "./types";
import { usePaginacao } from "./use-paginacao";

const POR_PAGINA = 6;

function formatarDataLonga(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function jaPassou(dataISO: string): boolean {
  return dataISO < new Date().toISOString().slice(0, 10);
}

export function EventosSection({
  comunidades,
  eventos,
  carregando,
  onAlterado,
}: {
  comunidades: Comunidade[];
  eventos: Evento[];
  carregando: boolean;
  onAlterado: () => void;
}) {
  const router = useRouter();

  const { itensPagina, pagina, totalPaginas, total, proxima, anterior } = usePaginacao(
    eventos,
    POR_PAGINA,
  );

  async function handleExcluir(evento: Evento) {
    if (!window.confirm(`Excluir o evento "${evento.titulo}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    const res = await fetch(`/api/eventos/${evento.id}`, { method: "DELETE" });
    if (res.ok) {
      onAlterado();
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Eventos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visíveis no calendário de{" "}
            {comunidades.length === 1 ? comunidades[0].nomeCurto : "toda a paróquia"}
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/eventos/novo")}
          className="h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus />
          Novo evento
        </Button>
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {itensPagina.map((evento) => {
            const passou = jaPassou(evento.data);
            return (
              <li key={evento.id} className="flex overflow-hidden rounded-2xl bg-muted/60">
                <div className={cn("w-1", passou ? "bg-border" : "bg-primary")} />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {comunidades.length > 1 ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                          {evento.comunidadeNomeCurto}
                        </span>
                      ) : null}
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatarDataLonga(evento.data)}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar evento"
                        onClick={() => router.push(`/dashboard/eventos/${evento.id}`)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Excluir evento"
                        onClick={() => handleExcluir(evento)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-foreground">{evento.titulo}</p>

                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock size={14} strokeWidth={1.75} />
                      {evento.horaInicio} – {evento.horaFim}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} strokeWidth={1.75} />
                      {evento.local}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!carregando && eventos.length > 0 ? (
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
