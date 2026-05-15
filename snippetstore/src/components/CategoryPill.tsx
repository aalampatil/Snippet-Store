import { Pressable, StyleSheet, Text } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type CategoryPillProps = {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
};

export function CategoryPill({ label, active, color, onPress }: CategoryPillProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.active,
        color ? { borderColor: color } : null,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, active && styles.activeText]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pill: {
      minHeight: 36,
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
    },
    active: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    pressed: {
      opacity: 0.82,
    },
    text: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    activeText: {
      color: colors.background,
    },
  });
}
