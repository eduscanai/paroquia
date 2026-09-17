import "@/global.css";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlayfairDisplay_400Regular, useFonts } from "@expo-google-fonts/playfair-display";
import { useColorScheme } from "nativewind";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AvisosProvider } from "@/context/avisos-context";
import { TEMA_STORAGE_KEY, type Tema } from "@/lib/tema";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
  });
  const [temaCarregado, setTemaCarregado] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(TEMA_STORAGE_KEY).then((salvo) => {
      if (salvo === "escuro" || salvo === "claro") {
        setColorScheme((salvo as Tema) === "escuro" ? "dark" : "light");
      }
      setTemaCarregado(true);
    });
  }, [setColorScheme]);

  useEffect(() => {
    if (fontsLoaded && temaCarregado) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, temaCarregado]);

  if (!fontsLoaded || !temaCarregado) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AvisosProvider>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="cadastro" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="aviso/[id]" />
          <Stack.Screen name="dizimo/index" />
          <Stack.Screen name="dizimo/pagamento" />
          <Stack.Screen name="dizimo/sucesso" />
          <Stack.Screen name="dizimo/historico" />
          <Stack.Screen name="ofertar/pix" />
          <Stack.Screen name="ofertar/sucesso" />
          <Stack.Screen name="ofertar/historico" />
          <Stack.Screen name="notificacoes" />
          <Stack.Screen name="perfil/editar" />
        </Stack>
      </AvisosProvider>
    </SafeAreaProvider>
  );
}
