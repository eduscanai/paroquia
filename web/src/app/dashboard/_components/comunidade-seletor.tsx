"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { Comunidade } from "./types";

export function ComunidadeSeletor({
  comunidades,
  valor,
  onChange,
  permitirParoquiaInteira,
}: {
  comunidades: Comunidade[];
  valor: string;
  onChange: (id: string) => void;
  permitirParoquiaInteira?: boolean;
}) {
  if (comunidades.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <Label>Comunidade</Label>
      <div className="flex flex-wrap gap-2">
        {permitirParoquiaInteira ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              valor === ""
                ? "border-transparent bg-accent text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            Toda a paróquia
          </button>
        ) : null}
        {comunidades.map((comunidade) => (
          <button
            key={comunidade.id}
            type="button"
            onClick={() => onChange(comunidade.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              valor === comunidade.id
                ? "border-transparent bg-accent text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {comunidade.nomeCurto}
          </button>
        ))}
      </div>
    </div>
  );
}
