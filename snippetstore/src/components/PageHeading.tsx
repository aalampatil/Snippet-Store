import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { fonts } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.row, width < 650 && { flexDirection: "column", alignItems: "stretch" }]}>
      <View style={styles.text}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text, fontSize: width < 650 ? 27 : 32 }]}
        >
          {title}
        </Text>
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      </View>
      {action}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 22 },
  text: { flex: 1, gap: 10 },
  eyebrow: { fontFamily: fonts.sans, fontSize: 10, letterSpacing: 1.8, fontWeight: "600" },
  title: { fontFamily: fonts.sans, fontWeight: "600", letterSpacing: -1.1, lineHeight: 40 },
  description: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, maxWidth: 520 },
});
