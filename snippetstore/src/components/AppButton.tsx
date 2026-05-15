import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type AppButtonProps = PressableProps & {
  title: string;
  tone?: "primary" | "secondary" | "danger";
};

export function AppButton({ title, tone = "primary", disabled, style, ...props }: AppButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.base,
        tone === "primary" && styles.primary,
        tone === "secondary" && styles.secondary,
        tone === "danger" && styles.danger,
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <Text style={[styles.text, tone === "primary" && styles.primaryText]}>{title}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
    },
    primary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: "transparent",
      borderColor: colors.danger,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.8,
    },
    text: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    primaryText: {
      color: colors.background,
    },
  });
}
