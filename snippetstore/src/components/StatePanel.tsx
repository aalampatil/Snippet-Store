import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { AppButton } from "./AppButton";
import { Icon, type IconName } from "./Icon";

export function StatePanel({
  title,
  description,
  icon = "code",
  loading,
  action,
  onAction,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  loading?: boolean;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Icon name={icon} color={colors.accent} size={26} />
        )}
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      ) : null}
      {action && onAction ? <AppButton title={action} onPress={onAction} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
    gap: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 19,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 22,
    maxWidth: 340,
    textAlign: "center",
    marginBottom: 6,
  },
});
