"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { ComunidadeSeletor } from "../../_components/comunidade-seletor";
import type { Comunidade } from "../../_components/types";

const pillInputClass =
  "h-12 rounded-full border-none bg-muted px-5 text-base placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40";

export default function EditarCampanhaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const novo = params.id === "novo";
  const { data: session, isPending: sessaoCarregando } = authClient.useSession();
  const role = session?.user?.role;

  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  const [formComunidadeId, setFormComunidadeId] = useState("");
  const [comunidadeAtualNome, setComunidadeAtualNome] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formMeta, setFormMeta] = useState("");
  const [formArrecadado, setFormArrecadado] = useState("");
  const [formAtiva, setFormAtiva] = useState(true);
  const [formPriorizada, setFormPriorizada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;
    let ativo = true;

    async function carregar() {
      try {
        const dadosComunidades: Comunidade[] =
          role === "comunidade"
            ? await fetch("/api/comunidade/me")
                .then((r) => r.json())
                .then((d) => (d.comunidade ? [d.comunidade] : []))
            : await fetch("/api/comunidades")
                .then((r) => r.json())
                .then((d) => d.comunidades ?? []);

        if (!ativo) return;
        setComunidades(dadosComunidades);

        if (novo) {
          setFormComunidadeId(dadosComunidades[0]?.id ?? "");
        } else {
          const res = await fetch("/api/campanhas");
          const data = await res.json();
          if (!ativo) return;
          if (!res.ok) {
            setErroCarregar(data.error ?? "Não foi possível carregar a campanha.");
            return;
          }
          const campanha = (data.campanhas ?? []).find(
            (c: { id: string }) => c.id === params.id,
          );
          if (!campanha) {
            setErroCarregar("Campanha não encontrada.");
            return;
          }
          setFormComunidadeId(campanha.comunidadeId ?? "");
          setComunidadeAtualNome(campanha.comunidadeNomeCurto);
          setFormTitulo(campanha.titulo);
          setFormDescricao(campanha.descricao);
          setFormMeta(String(campanha.meta));
          setFormArrecadado(String(campanha.arrecadado));
          setFormAtiva(campanha.ativa);
          setFormPriorizada(campanha.priorizada);
        }
      } catch {
        if (ativo) setErroCarregar("Não foi possível conectar ao servidor.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [role, novo, params.id]);

  async function handleSalvar() {
    const meta = Number(formMeta.replace(",", "."));
    const arrecadado = formArrecadado ? Number(formArrecadado.replace(",", ".")) : 0;

    if (!formTitulo.trim() || !formDescricao.trim() || !(meta > 0)) {
      setErroForm("Preencha título, descrição e uma meta maior que zero.");
      return;
    }

    setSalvando(true);
    setErroForm(null);
    try {
      const corpo = {
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim(),
        meta,
        arrecadado,
        ativa: formAtiva,
        priorizada: formPriorizada,
      };

      const res = novo
        ? await fetch("/api/campanhas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comunidadeId: formComunidadeId || null, ...corpo }),
          })
        : await fetch(`/api/campanhas/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErroForm(data?.error ?? "Não foi possível salvar a campanha.");
        return;
      }

      router.push("/dashboard?aba=campanhas");
    } catch {
      setErroForm("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard?aba=campanhas")}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="font-serif text-2xl text-foreground">
          {novo ? "Nova campanha" : "Editar campanha"}
        </h1>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        {sessaoCarregando || carregando ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : erroCarregar ? (
          <p className="text-sm text-destructive">{erroCarregar}</p>
        ) : (
          <div className="flex flex-col gap-5">
            {novo ? (
              <ComunidadeSeletor
                comunidades={comunidades}
                valor={formComunidadeId}
                onChange={setFormComunidadeId}
                permitirParoquiaInteira
              />
            ) : comunidades.length > 1 ? (
              <p className="text-sm text-muted-foreground">
                Comunidade:{" "}
                <span className="font-medium text-foreground">
                  {comunidadeAtualNome ?? "Toda a paróquia"}
                </span>
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="ctitulo">Título</Label>
              <Input
                id="ctitulo"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: Reforma do telhado da Matriz"
                className={pillInputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cdescricao">Descrição</Label>
              <Textarea
                id="cdescricao"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Detalhes da campanha"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cmeta">Meta (R$)</Label>
                <Input
                  id="cmeta"
                  inputMode="decimal"
                  value={formMeta}
                  onChange={(e) => setFormMeta(e.target.value)}
                  placeholder="45000"
                  className={pillInputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="carrecadado">Já arrecadado (R$)</Label>
                <Input
                  id="carrecadado"
                  inputMode="decimal"
                  value={formArrecadado}
                  onChange={(e) => setFormArrecadado(e.target.value)}
                  placeholder="0"
                  className={pillInputClass}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormAtiva((v) => !v)}
              className={cn(
                "flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                formAtiva
                  ? "border-transparent bg-accent text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {formAtiva ? "Ativa (visível no app)" : "Inativa (oculta no app)"}
            </button>

            {role === "paroquia" || role === "desenvolvedor" ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setFormPriorizada((v) => !v)}
                  className={cn(
                    "flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    formPriorizada
                      ? "border-transparent bg-accent text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {formPriorizada ? "Priorizada" : "Priorizar campanha"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Toda oferta feita sem escolher uma campanha (&ldquo;Onde for mais
                  necessário&rdquo;) passa a contar pra meta desta. Só uma campanha pode estar
                  priorizada por vez.
                </p>
              </div>
            ) : null}

            {erroForm ? <p className="text-sm text-destructive">{erroForm}</p> : null}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSalvar}
                disabled={salvando}
                className="h-12 rounded-full bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90"
              >
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard?aba=campanhas")}
                className="h-12 rounded-full px-8"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
