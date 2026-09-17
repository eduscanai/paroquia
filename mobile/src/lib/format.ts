export function formatarNumero(valor: number): string {
  const fixo = valor.toFixed(2);
  const [inteiro, decimal] = fixo.split(".");
  const comSeparador = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${comSeparador},${decimal}`;
}

export function formatarMoeda(valor: number): string {
  return `R$ ${formatarNumero(valor)}`;
}

/** Extrai só os dígitos de um texto e formata como DD/MM/AAAA conforme a pessoa digita. */
export function formatarDataDigitada(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 8);
  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  const ano = digitos.slice(4, 8);
  return [dia, mes, ano].filter(Boolean).join("/");
}

/** Converte "DD/MM/AAAA" pra "AAAA-MM-DD" (formato ISO usado pela API). Retorna null se incompleta/inválida. */
export function dataBrParaISO(dataBr: string): string | null {
  const match = dataBr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (data.getFullYear() !== Number(ano) || data.getMonth() !== Number(mes) - 1 || data.getDate() !== Number(dia)) {
    return null;
  }
  return `${ano}-${mes}-${dia}`;
}
