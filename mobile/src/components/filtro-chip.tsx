import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function FiltroChip({
  label,
  selected,
  onPress,
  icon,
  sigla,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  sigla?: string;
}) {
  return (
    <Pressable onPress={onPress} className="w-20 items-center gap-2">
      <View
        className={`size-16 items-center justify-center rounded-full bg-muted ${
          selected ? "border-2 border-primary" : ""
        }`}
      >
        {icon ?? (
          <Text
            className={`text-base font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}
          >
            {sigla}
          </Text>
        )}
      </View>
      <Text numberOfLines={2} className="text-center text-xs text-muted-foreground">
        {label}
      </Text>
    </Pressable>
  );
}
