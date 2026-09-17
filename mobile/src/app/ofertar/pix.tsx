import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, Copy, Loader, RotateCcw } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { consultarStatusPix, criarCobrancaPix, type CobrancaPix } from "@/lib/api";
import { formatarDataHora } from "@/lib/date";
import { formatarMoeda } from "@/lib/format";
import { useCorIcone } from "@/lib/use-cor-icone";

const DURACAO_EXPIRACAO_SEGUNDOS = 30 * 60;
const INTERVALO_POLLING_MS = 3000;

export default function OfertarPixScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const { valor, campanhaId } = useLocalSearchParams<{ valor: string; campanhaId?: string }>();
  const valorNum = Number(valor);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cobranca, setCobranca] = useState<CobrancaPix | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(DURACAO_EXPIRACAO_SEGUNDOS);

  const criarCobranca = useCallback(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    setCobranca(null);
    setSegundosRestantes(DURACAO_EXPIRACAO_SEGUNDOS);
    criarCobrancaPix({ tipo: "oferta", valor: valorNum, campanhaId: campanhaId || null }).then(
      (resultado) => {
        if (!ativo) return;
        if (!resultado.ok) {
          setErro(resultado.erro);
        } else {
          setCobranca(resultado.cobranca);
        }
        setCarregando(false);
      },
    );
    return () => {
      ativo = false;
    };
  }, [valorNum, campanhaId]);

  useEffect(() => criarCobranca(), [criarCobranca]);

  useEffect(() => {
    if (!cobranca) return;
    const intervalo = setInterval(async () => {
      const status = await consultarStatusPix(cobranca.id);
      if (status === "aprovado") {
        clearInterval(intervalo);
        router.replace({
          pathname: "/ofertar/sucesso",
          params: { valor: String(valorNum), dataPagamento: formatarDataHora(new Date()) },
        });
      } else if (status === "recusado") {
        clearInterval(intervalo);
        setErro("O pagamento foi recusado. Tente novamente.");
      }
    }, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [cobranca, router, valorNum]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundosRestantes((segundos) => Math.max(0, segundos - 1));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  async function copiarCodigo() {
    if (!cobranca) return;
    await Clipboard.setStringAsync(cobranca.qrCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
  const segundos = String(segundosRestantes % 60).padStart(2, "0");

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
        <Text className="flex-1 text-center text-lg font-bold text-foreground">Ofertar</Text>
        <View className="w-8" />
      </View>

      <ScrollView
        contentContainerClassName="items-center gap-4 px-6 pb-10 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-4xl font-extrabold text-foreground">{formatarMoeda(valorNum)}</Text>

        {carregando ? (
          <ActivityIndicator color="#7C3AED" />
        ) : erro ? (
          <>
            <Text className="text-center text-sm text-red-600">{erro}</Text>
            <Pressable
              onPress={criarCobranca}
              className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary px-6 active:opacity-90"
            >
              <RotateCcw size={16} strokeWidth={2} color="#FFFFFF" />
              <Text className="text-base font-bold text-primary-foreground">Tentar novamente</Text>
            </Pressable>
          </>
        ) : cobranca ? (
          <>
            <View className="items-center justify-center rounded-3xl border border-muted p-4">
              <Image
                source={{
                  uri: cobranca.qrCodeBase64
                    ? `data:image/png;base64,${cobranca.qrCodeBase64}`
                    : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cobranca.qrCode)}`,
                }}
                className="size-56"
              />
            </View>

            <Pressable
              onPress={copiarCodigo}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-full bg-primary active:opacity-90"
            >
              <Copy size={18} strokeWidth={2} color="#FFFFFF" />
              <Text className="text-base font-bold text-primary-foreground">
                {copiado ? "Código copiado!" : "Copiar código Pix"}
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Loader size={14} strokeWidth={2} color={corIcone.mutedForeground} />
              <Text className="text-sm text-muted-foreground">
                Assim que o banco confirmar, esta tela avisa.
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5">
              <Clock size={14} strokeWidth={2} color="#EA580C" />
              <Text className="text-sm font-bold text-orange-600">
                Expira em {minutos}:{segundos}
              </Text>
            </View>
          </>
        ) : null}

        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base font-bold text-primary">Cancelar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
