"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

import { ComunidadeSeletor } from "../../_components/comunidade-seletor";
import type { Comunidade } from "../../_components/types";

const pillInputClass =
  "h-12 rounded-full border-none bg-muted px-5 text-base placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40";

export default function EditarEventoPage() {
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
  const [formData, setFormData] = useState("");
  const [formHoraInicio, setFormHoraInicio] = useState("");
  const [formHoraFim, setFormHoraFim] = useState("");
  const [formLocal, setFormLocal] = useState("");
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
          const primeira = dadosComunidades[0];
          setFormComunidadeId(primeira?.id ?? "");
          setFormLocal(dadosComunidades.length === 1 ? (primeira?.nome ?? "") : "");
        } else {
          const res = await fetch("/api/eventos");
          const data = await res.json();
          if (!ativo) return;
          if (!res.ok) {
            setErroCarregar(data.error ?? "Não foi possível carregar o evento.");
            return;
          }
          const evento = (data.eventos ?? []).find((e: { id: string }) => e.id === params.id);
          if (!evento) {
            setErroCarregar("Evento não encontrado.");
            return;
          }
          setFormComunidadeId(evento.comunidadeId);
          setComunidadeAtualNome(evento.comunidadeNomeCurto);
          setFormTitulo(evento.titulo);
          setFormData(evento.data);
          setFormHoraInicio(evento.horaInicio);
          setFormHoraFim(evento.horaFim);
          setFormLocal(evento.local);
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
    if (!formTitulo.trim() || !formData || !formHoraInicio || !formHoraFim || !formLocal.trim()) {
      setErroForm("Preencha todos os campos.");
      return;
    }
    if (formHoraFim <= formHoraInicio) {
      setErroForm("O horário de término precisa ser depois do início.");
      return;
    }
    if (!formComunidadeId) {
      setErroForm("Selecione uma comunidade.");
      return;
    }

    setSalvando(true);
    setErroForm(null);
    try {
      const corpo = {
        titulo: formTitulo.trim(),
        data: formData,
        horaInicio: formHoraInicio,
        horaFim: formHoraFim,
        local: formLocal.trim(),
      };

      const res = novo
        ? await fetch("/api/eventos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comunidadeId: formComunidadeId, ...corpo }),
          })
        : await fetch(`/api/eventos/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErroForm(data?.error ?? "Não foi possível salvar o evento.");
        return;
      }

      router.push("/dashboard?aba=eventos");
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
          onClick={() => router.push("/dashboard?aba=eventos")}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="font-serif text-2xl text-foreground">
          {novo ? "Novo evento" : "Editar evento"}
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
              />
            ) : comunidades.length > 1 ? (
              <p className="text-sm text-muted-foreground">
                Comunidade:{" "}
                <span className="font-medium text-foreground">{comunidadeAtualNome}</span>
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="etitulo">Título</Label>
              <Input
                id="etitulo"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: Missa dominical"
                className={pillInputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edata">Data</Label>
              <Input
                id="edata"
                type="date"
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                className={pillInputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ehorainicio">Início</Label>
                <Input
                  id="ehorainicio"
                  type="time"
                  value={formHoraInicio}
                  onChange={(e) => setFormHoraInicio(e.target.value)}
                  className={pillInputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ehorafim">Término</Label>
                <Input
                  id="ehorafim"
                  type="time"
                  value={formHoraFim}
                  onChange={(e) => setFormHoraFim(e.target.value)}
                  className={pillInputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="elocal">Local</Label>
              <Input
                id="elocal"
                value={formLocal}
                onChange={(e) => setFormLocal(e.target.value)}
                placeholder="Ex: Matriz Santo Antônio"
                className={pillInputClass}
              />
            </div>

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
                onClick={() => router.push("/dashboard?aba=eventos")}
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
