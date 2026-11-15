import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { fonts } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Icon, type IconName } from "./Icon";

type AppButtonProps = PressableProps & {
  title: string;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  loading?: boolean;
  small?: boolean;
};
export function AppButton({
  title,
  tone = "primary",
  icon,
  loading,
  small,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const { colors } = useTheme();
  const foreground =
    tone === "primary" ? colors.onAccent : tone === "danger" ? colors.danger : colors.text;
  const isDisabled = !!disabled || !!loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      {...props}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          backgroundColor:
            tone === "primary"
              ? colors.accent
              : tone === "secondary"
                ? colors.surface
                : tone === "danger"
                  ? colors.dangerSoft
                  : "transparent",
          borderColor:
            tone === "primary"
              ? colors.accent
              : tone === "ghost"
                ? "transparent"
                : tone === "danger"
                  ? colors.dangerSoft
                  : colors.border,
        },
        small && styles.small,
        isDisabled && { opacity: 0.45 },
        state.pressed && !isDisabled && { opacity: 0.7, transform: [{ scale: 0.98 }] },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : icon ? (
        <Icon name={icon} color={foreground} size={small ? 15 : 17} />
      ) : null}
      <Text style={[styles.text, { color: foreground }, small && { fontSize: 12 }]}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
  },
  small: { minHeight: 36, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 7 },
  text: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "600" },
});
