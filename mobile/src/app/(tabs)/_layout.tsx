import { Tabs } from "expo-router";
import { Calendar, HandCoins, HandHeart, Megaphone, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#7C3AED";
const INACTIVE_COLOR_CLARO = "#9CA3AF";
const INACTIVE_COLOR_ESCURO = "#9C96AC";
const TAB_BAR_BG_CLARO = "#FFFFFF";
const TAB_BAR_BG_ESCURO = "#0A090F";
const TAB_BAR_BORDA_CLARO = "#F1F1F4";
const TAB_BAR_BORDA_ESCURO = "#241E33";

function TabIcon({
  focused,
  color,
  Icon,
}: {
  focused: boolean;
  color: ColorValue;
  Icon: typeof Megaphone;
}) {
  return (
    <View
      className={`items-center justify-center rounded-full px-4 py-1.5 ${
        focused ? "bg-accent" : ""
      }`}
    >
      <Icon color={color} size={22} strokeWidth={2} />
    </View>
  );
}

export default function TabsLayout() {
  // O próprio SO informa a altura exata da barra/gesto de navegação do
  // aparelho via `insets.bottom` — nada de valor fixo somado por cima,
  // se adapta a cada aparelho automaticamente.
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const escuro = colorScheme === "dark";

  return (
    <Tabs
      initialRouteName="avisos"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: escuro ? INACTIVE_COLOR_ESCURO : INACTIVE_COLOR_CLARO,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: {
          backgroundColor: escuro ? TAB_BAR_BG_ESCURO : TAB_BAR_BG_CLARO,
          borderTopWidth: 1,
          borderTopColor: escuro ? TAB_BAR_BORDA_ESCURO : TAB_BAR_BORDA_CLARO,
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="avisos"
        options={{
          title: "Avisos",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} Icon={Megaphone} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendário",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} Icon={Calendar} />
          ),
        }}
      />
      <Tabs.Screen
        name="ofertar"
        options={{
          title: "Ofertar",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} Icon={HandCoins} />
          ),
        }}
      />
      <Tabs.Screen
        name="oracoes"
        options={{
          title: "Orações",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} Icon={HandHeart} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} Icon={User} />
          ),
        }}
      />
    </Tabs>
  );
}
