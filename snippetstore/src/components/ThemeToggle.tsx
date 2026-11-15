import { Pressable } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const { colors, mode, toggleTheme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${mode === "dark" ? "light" : "dark"} theme`}
      onPress={toggleTheme}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
        backgroundColor: pressed ? colors.surfaceAlt : "transparent",
      })}
    >
      <Icon name={mode === "dark" ? "sun" : "moon"} color={colors.secondary} size={18} />
    </Pressable>
  );
}
