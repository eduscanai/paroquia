"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Paginacao({
  pagina,
  totalPaginas,
  total,
  porPagina,
  onAnterior,
  onProxima,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onAnterior: () => void;
  onProxima: () => void;
}) {
  if (totalPaginas <= 1) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return (
    <div className="flex items-center justify-between pt-1">
      <p className="text-xs text-muted-foreground">
        {inicio}–{fim} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onAnterior}
          disabled={pagina === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft />
        </Button>
        <span className="text-xs text-muted-foreground">
          Página {pagina} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onProxima}
          disabled={pagina === totalPaginas}
          aria-label="Próxima página"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
