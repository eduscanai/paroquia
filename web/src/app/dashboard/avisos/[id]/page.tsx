"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Pin, X } from "lucide-react";

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

export default function EditarAvisoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const novo = params.id === "novo";
  const { data: session, isPending: sessaoCarregando } = authClient.useSession();
  const role = session?.user?.role;

  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  const [formComunidadeId, setFormComunidadeId] = useState("");
  const [comunidadeAtualNome, setComunidadeAtualNome] = useState("");
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formImagemUrl, setFormImagemUrl] = useState("");
  const [formFixado, setFormFixado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const inputImagemRef = useRef<HTMLInputElement>(null);

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
          const res = await fetch(`/api/avisos/${params.id}`);
          const data = await res.json();
          if (!ativo) return;
          if (!res.ok) {
            setErroCarregar(data.error ?? "Não foi possível carregar o aviso.");
            return;
          }
          setFormComunidadeId(data.aviso.comunidadeId);
          setComunidadeAtualNome(data.aviso.comunidadeNomeCurto);
          setFormTitulo(data.aviso.titulo);
          setFormDescricao(data.aviso.descricao);
          setFormImagemUrl(data.aviso.imagemUrl ?? "");
          setFormFixado(data.aviso.fixado);
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

  async function handleSelecionarImagem(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    if (arquivo.size > 5 * 1024 * 1024) {
      setErroForm("A imagem precisa ter no máximo 5 MB.");
      return;
    }

    setErroForm(null);
    setEnviandoImagem(true);
    try {
      const form = new FormData();
      form.append("file", arquivo);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setErroForm(data?.error ?? "Não foi possível enviar a imagem.");
        return;
      }
      setFormImagemUrl(data.url);
    } catch {
      setErroForm("Não foi possível conectar ao servidor.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  async function handleSalvar() {
    if (!formTitulo.trim() || !formDescricao.trim()) {
      setErroForm("Preencha título e descrição.");
      return;
    }
    if (novo && !formComunidadeId) {
      setErroForm("Selecione uma comunidade.");
      return;
    }

    setSalvando(true);
    setErroForm(null);
    try {
      const corpo = {
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim(),
        imagemUrl: formImagemUrl.trim() || null,
        fixado: formFixado,
      };

      const res = novo
        ? await fetch("/api/avisos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comunidadeId: formComunidadeId, ...corpo }),
          })
        : await fetch(`/api/avisos/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErroForm(data?.error ?? "Não foi possível salvar o aviso.");
        return;
      }

      router.push("/dashboard?aba=avisos");
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
          onClick={() => router.push("/dashboard?aba=avisos")}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="font-serif text-2xl text-foreground">
          {novo ? "Novo aviso" : "Editar aviso"}
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
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: Missa solene no dia 13"
                className={pillInputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Detalhes do aviso"
                rows={6}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Imagem (opcional)</Label>
              <input
                ref={inputImagemRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleSelecionarImagem}
                className="hidden"
              />

              {formImagemUrl ? (
                <div className="relative overflow-hidden rounded-2xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formImagemUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormImagemUrl("")}
                    aria-label="Remover imagem"
                    className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputImagemRef.current?.click()}
                  disabled={enviandoImagem}
                  className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <ImagePlus size={22} strokeWidth={1.75} />
                  <span className="text-sm font-medium">
                    {enviandoImagem ? "Enviando…" : "Escolher imagem"}
                  </span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFormFixado((v) => !v)}
              className={cn(
                "flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                formFixado
                  ? "border-transparent bg-accent text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              <Pin size={16} strokeWidth={2} />
              {formFixado ? "Fixado" : "Fixar este aviso"}
            </button>

            {erroForm ? <p className="text-sm text-destructive">{erroForm}</p> : null}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSalvar}
                disabled={salvando || enviandoImagem}
                className="h-12 rounded-full bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90"
              >
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard?aba=avisos")}
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
