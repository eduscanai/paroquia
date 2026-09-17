import { Pin } from "lucide-react-native";
import { Pressable } from "react-native";

const SIZES = {
  sm: { button: "size-6", icon: 12 },
  md: { button: "size-8", icon: 16 },
} as const;

export function PinButton({
  pinned,
  onToggle,
  size = "sm",
}: {
  pinned: boolean;
  onToggle: () => void;
  size?: keyof typeof SIZES;
}) {
  const { button, icon } = SIZES[size];

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      hitSlop={10}
      accessibilityLabel={pinned ? "Desafixar aviso" : "Fixar aviso"}
      className={`${button} items-center justify-center rounded-full ${
        pinned ? "bg-primary" : "bg-muted"
      }`}
    >
      <Pin
        size={icon}
        strokeWidth={2}
        color={pinned ? "#FFFFFF" : "#6B7280"}
        fill={pinned ? "#FFFFFF" : "transparent"}
      />
    </Pressable>
  );
}
