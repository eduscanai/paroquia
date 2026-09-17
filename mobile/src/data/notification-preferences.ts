export type NotificationPreferences = {
  lembreteMissa: boolean;
  lembreteDizimo: boolean;
  avisosImportantes: boolean;
  campanhas: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  lembreteMissa: true,
  lembreteDizimo: true,
  avisosImportantes: true,
  campanhas: false,
};

export const NOTIFICATION_PREFERENCES_STORAGE_KEY = "notification-preferences";
