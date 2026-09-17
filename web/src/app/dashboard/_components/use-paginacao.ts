import { useState } from "react";

export function usePaginacao<T>(itens: T[], porPagina: number) {
  const [paginaSolicitada, setPaginaSolicitada] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  // Deriva a página atual a cada render em vez de reagir por effect — se a
  // lista encolher (filtro/busca) e a página pedida ficar fora do intervalo,
  // volta pra última página válida automaticamente.
  const pagina = Math.min(paginaSolicitada, totalPaginas);

  const inicio = (pagina - 1) * porPagina;
  const itensPagina = itens.slice(inicio, inicio + porPagina);

  return {
    itensPagina,
    pagina,
    totalPaginas,
    total: itens.length,
    proxima: () => setPaginaSolicitada((p) => Math.min(p + 1, totalPaginas)),
    anterior: () => setPaginaSolicitada((p) => Math.max(p - 1, 1)),
  };
}
