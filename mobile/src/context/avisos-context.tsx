import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { alternarFixado, buscarAvisos, type Aviso } from "@/lib/api";

function ordenarAvisos(avisos: Aviso[]): Aviso[] {
  return [...avisos].sort((a, b) => {
    if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
    const dataHoraA = `${a.data} ${a.hora}`;
    const dataHoraB = `${b.data} ${b.hora}`;
    return dataHoraB.localeCompare(dataHoraA);
  });
}

type AvisosContextValue = {
  avisos: Aviso[];
  carregando: boolean;
  recarregar: () => Promise<void>;
  togglePin: (id: string) => void;
};

const AvisosContext = createContext<AvisosContextValue | null>(null);

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await buscarAvisos();
      setAvisos(ordenarAvisos(dados));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const togglePin = useCallback(
    (id: string) => {
      const alvo = avisos.find((aviso) => aviso.id === id);
      if (!alvo) return;

      const novoFixado = !alvo.fixado;
      setAvisos((prev) =>
        ordenarAvisos(
          prev.map((aviso) => (aviso.id === id ? { ...aviso, fixado: novoFixado } : aviso)),
        ),
      );

      alternarFixado(id, novoFixado).then((ok) => {
        if (!ok) {
          setAvisos((prev) =>
            ordenarAvisos(
              prev.map((aviso) => (aviso.id === id ? { ...aviso, fixado: !novoFixado } : aviso)),
            ),
          );
        }
      });
    },
    [avisos],
  );

  return (
    <AvisosContext.Provider value={{ avisos, carregando, recarregar, togglePin }}>
      {children}
    </AvisosContext.Provider>
  );
}

export function useAvisos() {
  const context = useContext(AvisosContext);
  if (!context) {
    throw new Error("useAvisos must be used within an AvisosProvider");
  }
  return context;
}
