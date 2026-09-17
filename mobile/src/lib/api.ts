import { authClient } from "@/lib/auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function apiFetch(path: string, options: RequestInit = {}) {
  const cookie = await authClient.getCookie();

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      cookie,
      ...options.headers,
    },
  });
}

export type Comunidade = {
  id: string;
  sigla: string;
  nome: string;
  nomeCurto: string;
};

export async function buscarComunidades(): Promise<Comunidade[]> {
  try {
    // Endpoint público — chamada direta (sem cookie/Content-Type extra), pra
    // não disparar preflight de CORS no preview web e ficar mais simples.
    const res = await fetch(`${API_URL}/api/comunidades`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.comunidades;
  } catch {
    return [];
  }
}

export type PerfilFiel = {
  id: string;
  nome: string;
  email: string;
  sobrenome: string;
  dataNascimento: string;
  endereco: string;
  comunidadeId: string;
  comunidadeNome: string;
  comunidadeNomeCurto: string;
};

export async function buscarPerfilFiel(): Promise<PerfilFiel | null> {
  try {
    const res = await apiFetch("/api/fieis/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.fiel;
  } catch {
    return null;
  }
}

export async function atualizarPerfilFiel(dados: {
  nome?: string;
  sobrenome?: string;
  dataNascimento?: string;
  comunidadeId?: string;
  endereco?: string;
}): Promise<boolean> {
  const res = await apiFetch("/api/fieis/me", {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
  return res.ok;
}

export type Aviso = {
  id: string;
  comunidadeId: string;
  comunidadeNome: string;
  comunidadeNomeCurto: string;
  titulo: string;
  descricao: string;
  imagemUrl: string | null;
  fixado: boolean;
  data: string;
  hora: string;
};

export async function buscarAvisos(): Promise<Aviso[]> {
  try {
    const res = await apiFetch("/api/avisos");
    if (!res.ok) return [];
    const data = await res.json();
    return data.avisos;
  } catch {
    return [];
  }
}

export async function buscarAviso(id: string): Promise<Aviso | null> {
  try {
    const res = await apiFetch(`/api/avisos/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.aviso;
  } catch {
    return null;
  }
}

export async function alternarFixado(id: string, fixado: boolean): Promise<boolean> {
  const res = await apiFetch(`/api/avisos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fixado }),
  });
  return res.ok;
}

export type Campanha = {
  id: string;
  comunidadeId: string | null;
  comunidadeNome: string | null;
  comunidadeNomeCurto: string | null;
  titulo: string;
  descricao: string;
  meta: number;
  arrecadado: number;
  ativa: boolean;
};

export async function buscarCampanhas(): Promise<Campanha[]> {
  try {
    const res = await apiFetch("/api/campanhas");
    if (!res.ok) return [];
    const data = await res.json();
    return data.campanhas;
  } catch {
    return [];
  }
}

export type Evento = {
  id: string;
  comunidadeId: string;
  comunidadeSigla: string;
  comunidadeNome: string;
  comunidadeNomeCurto: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  local: string;
};

export async function buscarEventos(): Promise<Evento[]> {
  try {
    const res = await apiFetch("/api/eventos");
    if (!res.ok) return [];
    const data = await res.json();
    return data.eventos;
  } catch {
    return [];
  }
}

export type DizimoPerfil = {
  id: string;
  numero: number;
  diaVencimento: number;
  valorMensal: number;
  dizimistaDesde: string;
  comunidadeNome: string;
};

export type HistoricoDizimoItem = {
  mes: number;
  ano: number;
  status: "pago" | "isento" | "em_aberto" | "pendente";
  valor: number | null;
  pagoEm: string | null;
};

export async function buscarDizimo(): Promise<{
  dizimista: DizimoPerfil;
  historico: HistoricoDizimoItem[];
} | null> {
  try {
    const res = await apiFetch("/api/dizimo/me");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export type CobrancaPix = {
  id: string;
  qrCode: string;
  qrCodeBase64: string | null;
};

export async function criarCobrancaPix(
  dados:
    | { tipo: "oferta"; valor: number; campanhaId?: string | null }
    | { tipo: "dizimo"; valor: number; mes: number; ano: number },
): Promise<{ ok: true; cobranca: CobrancaPix } | { ok: false; erro: string }> {
  try {
    const res = await apiFetch("/api/pagamentos/pix", {
      method: "POST",
      body: JSON.stringify(dados),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, erro: data.error ?? "Não foi possível criar a cobrança." };
    }
    return { ok: true, cobranca: data };
  } catch {
    return { ok: false, erro: "Não foi possível conectar ao servidor." };
  }
}

export async function consultarStatusPix(
  id: string,
): Promise<"pendente" | "aprovado" | "recusado" | "erro"> {
  try {
    const res = await apiFetch(`/api/pagamentos/pix/${id}`);
    if (!res.ok) return "erro";
    const data = await res.json();
    return data.status;
  } catch {
    return "erro";
  }
}

export type OfertaHistorico = {
  id: string;
  valor: number;
  status: "pendente" | "confirmado" | "expirado";
  formaPagamento: string;
  criadoEm: string;
  confirmadoEm: string | null;
  campanhaTitulo: string | null;
};

export async function buscarHistoricoOfertas(): Promise<OfertaHistorico[]> {
  try {
    const res = await apiFetch("/api/ofertas/me");
    if (!res.ok) return [];
    const data = await res.json();
    return data.ofertas;
  } catch {
    return [];
  }
}

export async function cadastrarFiel(dados: {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  dataNascimento: string;
  comunidadeId: string;
  endereco: string;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  const res = await apiFetch("/api/fieis/cadastro", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, erro: data.error ?? "Erro ao criar conta." };
  }
  return { ok: true };
}
