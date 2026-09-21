import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { configurarDizimo } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { useCorIcone } from "@/lib/use-cor-icone";

export default function ConfigurarDizimoScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const { valorAtual } = useLocalSearchParams<{ valorAtual?: string }>();
  const jaEhDizimista = Boolean(valorAtual);

  const [digitos, setDigitos] = useState(() =>
    valorAtual ? String(Math.round(Number(valorAtual) * 100)) : "",
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valor = digitos ? Number(digitos) / 100 : 0;
  const valorTexto = formatarNumero(valor);

  function onChangeValor(texto: string) {
    const novosDigitos = texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setDigitos(novosDigitos);
  }

  async function handleSalvar() {
    if (valor <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    setSalvando(true);
    setErro(null);
    const resultado = await configurarDizimo(valor);
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="w-8"
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={24} strokeWidth={2} color={corIcone.foreground} />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-foreground">
          {jaEhDizimista ? "Mudar valor do dízimo" : "Quero ser dizimista"}
        </Text>
        <View className="w-8" />
      </View>

      <View className="flex-1 gap-6 px-6 pt-4">
        <Text className="text-sm text-muted-foreground">
          {jaEhDizimista
            ? "Esse passa a ser o novo valor da sua contribuição mensal a partir de agora."
            : "Escolha quanto você quer contribuir por mês. Dá pra mudar esse valor depois, quando quiser."}
        </Text>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Valor mensal</Text>
          <View className="h-14 flex-row items-center gap-1.5 rounded-full bg-muted px-4">
            <Text className={`text-base ${valor > 0 ? "text-foreground" : "text-muted-foreground"}`}>
              R$
            </Text>
            <TextInput
              value={valorTexto}
              onChangeText={onChangeValor}
              selection={{ start: valorTexto.length, end: valorTexto.length }}
              keyboardType="number-pad"
              autoFocus
              className={`flex-1 text-base ${valor > 0 ? "text-foreground" : "text-muted-foreground"}`}
            />
          </View>
        </View>

        {erro ? <Text className="text-sm text-red-600">{erro}</Text> : null}

        <Pressable
          onPress={handleSalvar}
          disabled={salvando || valor <= 0}
          className="h-12 items-center justify-center rounded-full bg-primary active:opacity-90 disabled:opacity-50"
        >
          <Text className="text-base font-bold text-primary-foreground">
            {salvando ? "Salvando…" : "Salvar"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
