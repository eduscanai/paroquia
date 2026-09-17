export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(base: Date, dias: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + dias);
  return toISODate(date);
}

const MESES_CURTOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatarDataHora(date: Date): string {
  const dia = date.getDate();
  const mes = MESES_CURTOS[date.getMonth()];
  const horas = String(date.getHours()).padStart(2, "0");
  const minutos = String(date.getMinutes()).padStart(2, "0");
  return `${dia} de ${mes}, ${horas}:${minutos}`;
}

export function formatarDataRelativa(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);

  const diffDias = Math.round((hoje.getTime() - data.getTime()) / 86_400_000);

  if (diffDias === 0) return "hoje";
  if (diffDias === 1) return "ontem";
  if (diffDias > 1 && diffDias < 7) return `há ${diffDias} dias`;
  if (diffDias >= 7 && diffDias < 14) return "há 1 semana";
  if (diffDias >= 14 && diffDias < 30) return `há ${Math.floor(diffDias / 7)} semanas`;
  if (diffDias < 0) return `em ${Math.abs(diffDias)} dias`;

  return `${dia} de ${MESES_CURTOS[mes - 1]}`;
}
