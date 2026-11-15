import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type CategoryPillProps = { label: string; active?: boolean; color?: string; onPress?: () => void };
export function CategoryPill({ label, active, color, onPress }: CategoryPillProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? colors.accentSoft : colors.surface,
          borderColor: active ? colors.accent : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text
        style={[styles.text, { color: active ? colors.accent : colors.secondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  pill: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 13,
  },
  text: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "500" },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
