import { StyleSheet, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export function Screen({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  return <View {...props} style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]} />;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
}
