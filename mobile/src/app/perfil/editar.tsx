import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, MapPin, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  atualizarPerfilFiel,
  buscarComunidades,
  buscarPerfilFiel,
  type Comunidade,
} from "@/lib/api";
import { dataBrParaISO, formatarDataDigitada } from "@/lib/format";
import { useCorIcone } from "@/lib/use-cor-icone";

function isoParaDataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function EditarPerfilScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimentoBr, setDataNascimentoBr] = useState("");
  const [endereco, setEndereco] = useState("");
  const [comunidadeId, setComunidadeId] = useState<string | null>(null);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);

  useEffect(() => {
    Promise.all([buscarPerfilFiel(), buscarComunidades()])
      .then(([perfil, listaComunidades]) => {
        setComunidades(listaComunidades);
        if (perfil) {
          setNome(perfil.nome);
          setSobrenome(perfil.sobrenome);
          setDataNascimentoBr(isoParaDataBr(perfil.dataNascimento));
          setEndereco(perfil.endereco);
          setComunidadeId(perfil.comunidadeId);
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  async function handleSalvar() {
    setErro(null);
    const dataNascimentoISO = dataBrParaISO(dataNascimentoBr);

    if (!nome || !sobrenome || !dataNascimentoISO || !comunidadeId || !endereco) {
      setErro("Preencha todos os campos com uma data de nascimento válida.");
      return;
    }

    setSalvando(true);
    try {
      const ok = await atualizarPerfilFiel({
        nome,
        sobrenome,
        dataNascimento: dataNascimentoISO,
        comunidadeId,
        endereco,
      });

      if (!ok) {
        setErro("Não foi possível salvar. Tente de novo.");
        return;
      }

      router.back();
    } catch {
      setErro("Não foi possível conectar ao servidor. Confira sua conexão.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
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
          Editar perfil
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerClassName="gap-5 px-6 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <Campo icon={<User size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Nome">
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-foreground"
          />
        </Campo>

        <Campo icon={<User size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Sobrenome">
          <TextInput
            value={sobrenome}
            onChangeText={setSobrenome}
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-foreground"
          />
        </Campo>

        <Campo
          icon={<Calendar size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />}
          label="Data de nascimento"
        >
          <TextInput
            value={dataNascimentoBr}
            onChangeText={(texto) => setDataNascimentoBr(formatarDataDigitada(texto))}
            keyboardType="number-pad"
            maxLength={10}
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-foreground"
          />
        </Campo>

        <Campo icon={<MapPin size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Endereço">
          <TextInput
            value={endereco}
            onChangeText={setEndereco}
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-foreground"
          />
        </Campo>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Comunidade</Text>
          <View className="flex-row flex-wrap gap-2">
            {comunidades.map((comunidade) => {
              const selecionada = comunidadeId === comunidade.id;
              return (
                <Pressable
                  key={comunidade.id}
                  onPress={() => setComunidadeId(comunidade.id)}
                  className={`h-11 items-center justify-center rounded-full px-4 ${
                    selecionada ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      selecionada ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {comunidade.nomeCurto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {erro ? <Text className="text-center text-sm text-red-600">{erro}</Text> : null}

        <Pressable
          onPress={handleSalvar}
          disabled={salvando}
          className="mt-2 h-14 items-center justify-center rounded-full bg-primary active:opacity-90"
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-primary-foreground">Salvar</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="h-14 flex-row items-center gap-3 rounded-full bg-muted px-4">
        {icon}
        {children}
      </View>
    </View>
  );
}
