// Carregado sob demanda (não no topo do arquivo): no Android, o Expo Go
// derruba o app inteiro só de importar "expo-notifications" no escopo do
// módulo, mesmo sem usar nenhuma função de push remoto — o pacote foi
// removido do Expo Go a partir do SDK 53. Importar dinamicamente aqui
// dentro, dentro de um try/catch, evita que isso quebre o app inteiro;
// a funcionalidade completa só existirá de fato num build próprio (fora
// do Expo Go).
let notificationsModulePromise: Promise<typeof import("expo-notifications")> | null = null;
let handlerConfigurado = false;

async function carregarNotifications() {
  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }
  const Notifications = await notificationsModulePromise;

  if (!handlerConfigurado) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigurado = true;
  }

  return Notifications;
}

export async function enviarNotificacaoDeTeste(): Promise<boolean> {
  try {
    const Notifications = await carregarNotifications();

    const permissao = await Notifications.getPermissionsAsync();
    if (permissao.status !== "granted") {
      const solicitada = await Notifications.requestPermissionsAsync();
      if (solicitada.status !== "granted") {
        return false;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Paróquia",
        body: "Essa é uma notificação de teste. Se você está vendo isso, funcionou! 🔔",
        sound: true,
      },
      trigger: null,
    });

    return true;
  } catch {
    return false;
  }
}
