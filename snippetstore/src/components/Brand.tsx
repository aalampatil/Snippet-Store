import { StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Icon } from "./Icon";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { backgroundColor: colors.accent }]}>
        <Icon name="code" color={colors.onAccent} size={23} />
      </View>
      {!compact ? (
        <Text style={[styles.name, { color: colors.text }]}>
          snippet<Text style={{ color: colors.muted }}>store</Text>
          <Text style={{ color: colors.accent }}>.</Text>
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.sans, fontSize: 21, fontWeight: "700", letterSpacing: -0.8 },
});
