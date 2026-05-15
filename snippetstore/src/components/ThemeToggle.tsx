import { Pressable, StyleSheet, Text } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable onPress={toggleTheme} style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
      <Text style={styles.text}>{mode === "dark" ? "Light" : "Dark"}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    toggle: {
      minHeight: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
    },
    pressed: {
      opacity: 0.82,
    },
    text: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
