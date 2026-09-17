export type Comunidade = {
  id: string;
  sigla: string;
  nome: string;
  nomeCurto: string;
};

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

export type Fiel = {
  id: string;
  nome: string;
  email: string;
  sobrenome: string;
  dataNascimento: string;
  endereco: string;
  membroDesde: string;
  comunidadeId: string;
  comunidadeNome: string;
  comunidadeNomeCurto: string;
};

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
  priorizada: boolean;
  doacoesSemDirecionamento: number;
};

export type SemDirecionamento = {
  total: number;
  quantidade: number;
  totalNaoCreditado: number;
  quantidadeNaoCreditada: number;
};

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

export type RelatorioOferta = {
  id: string;
  fielNome: string;
  comunidadeId: string | null;
  comunidadeNomeCurto: string | null;
  valor: number;
  campanhaTitulo: string | null;
  confirmadoEm: string;
};

export type RelatorioDizimo = {
  id: string;
  fielNome: string;
  comunidadeId: string;
  comunidadeNomeCurto: string;
  mes: number;
  ano: number;
  valor: number;
  pagoEm: string;
};
