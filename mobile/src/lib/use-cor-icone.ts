import { useColorScheme } from "nativewind";

// lucide-react-native recebe cor via prop (color="#hex"), não className — então
// não dá pra depender das variáveis CSS do tema pra esses ícones. Esse hook
// espelha os mesmos tons de foreground/muted-foreground do tailwind.config.js
// pra manter os ícones legíveis no escuro.
export function useCorIcone() {
  const { colorScheme } = useColorScheme();
  const escuro = colorScheme === "dark";

  return {
    foreground: escuro ? "#F3F1F8" : "#111827",
    mutedForeground: escuro ? "#9C96AC" : "#6B7280",
  };
}
