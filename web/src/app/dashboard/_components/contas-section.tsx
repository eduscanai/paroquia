"use client";

import { useState } from "react";
import { Church, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ComunidadeSeletor } from "./comunidade-seletor";
import type { Comunidade } from "./types";

const pillInputClass =
  "h-12 rounded-full border-none bg-muted px-5 text-base placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40";

export function ContasSection({
  comunidades,
  role,
}: {
  comunidades: Comunidade[];
  role: string;
}) {
  const podeCriarComunidade = role === "paroquia" || role === "desenvolvedor";

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Contas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre novas contas de fiéis{podeCriarComunidade ? " e de comunidade" : ""}.
        </p>
      </div>

      <NovaContaFiel comunidades={comunidades} />
      {podeCriarComunidade ? <NovaContaComunidade comunidades={comunidades} /> : null}
    </section>
  );
}

function NovaContaFiel({ comunidades }: { comunidades: Comunidade[] }) {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [comunidadeId, setComunidadeId] = useState(comunidades[0]?.id ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSalvar() {
    if (
      !nome.trim() ||
      !sobrenome.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !dataNascimento ||
      !endereco.trim() ||
      !comunidadeId
    ) {
      setErro("Preencha todos os campos.");
      setSucesso(null);
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const res = await fetch("/api/admin/fieis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          sobrenome: sobrenome.trim(),
          email: email.trim(),
          senha,
          dataNascimento,
          endereco: endereco.trim(),
          comunidadeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível criar a conta.");
        return;
      }
      setSucesso(`Conta de ${nome.trim()} criada com sucesso.`);
      setNome("");
      setSobrenome("");
      setEmail("");
      setSenha("");
      setDataNascimento("");
      setEndereco("");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-muted p-5">
      <div className="flex items-center gap-2">
        <UserPlus size={18} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Nova conta de fiel</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fnome">Nome</Label>
          <Input
            id="fnome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fsobrenome">Sobrenome</Label>
          <Input
            id="fsobrenome"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="femail">E-mail</Label>
          <Input
            id="femail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fsenha">Senha provisória</Label>
          <Input
            id="fsenha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fdata">Data de nascimento</Label>
          <Input
            id="fdata"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fendereco">Endereço</Label>
          <Input
            id="fendereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className={pillInputClass}
          />
        </div>
      </div>

      {comunidades.length > 1 ? (
        <ComunidadeSeletor comunidades={comunidades} valor={comunidadeId} onChange={setComunidadeId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Comunidade:{" "}
          <span className="font-medium text-foreground">{comunidades[0]?.nomeCurto}</span>
        </p>
      )}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      {sucesso ? <p className="text-sm text-green-600">{sucesso}</p> : null}

      <Button
        onClick={handleSalvar}
        disabled={salvando}
        className="h-12 w-fit rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
      >
        {salvando ? "Criando…" : "Criar conta"}
      </Button>
    </div>
  );
}

function NovaContaComunidade({ comunidades }: { comunidades: Comunidade[] }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [comunidadeId, setComunidadeId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSalvar() {
    if (!nome.trim() || !email.trim() || !senha.trim() || !comunidadeId) {
      setErro("Preencha todos os campos, incluindo a comunidade.");
      setSucesso(null);
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const res = await fetch("/api/admin/contas-comunidade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha, comunidadeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível criar a conta.");
        return;
      }
      setSucesso("Conta de comunidade criada com sucesso.");
      setNome("");
      setEmail("");
      setSenha("");
      setComunidadeId("");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-muted p-5">
      <div className="flex items-center gap-2">
        <Church size={18} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Nova conta de comunidade</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Cria o acesso da secretaria de uma comunidade específica ao painel.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cnome">Nome (ex: Secretaria da Matriz)</Label>
          <Input
            id="cnome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cemail">E-mail</Label>
          <Input
            id="cemail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={pillInputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="csenha">Senha provisória</Label>
          <Input
            id="csenha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={pillInputClass}
          />
        </div>
      </div>

      <ComunidadeSeletor comunidades={comunidades} valor={comunidadeId} onChange={setComunidadeId} />

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      {sucesso ? <p className="text-sm text-green-600">{sucesso}</p> : null}

      <Button
        onClick={handleSalvar}
        disabled={salvando}
        className="h-12 w-fit rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
      >
        {salvando ? "Criando…" : "Criar conta"}
      </Button>
    </div>
  );
}
