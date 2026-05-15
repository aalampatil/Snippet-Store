import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type AppTextInputProps = TextInputProps & {
  label: string;
};

export function AppTextInput({ label, style, multiline, ...props }: AppTextInputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        style={[styles.input, multiline && styles.multiline, style]}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    field: {
      gap: spacing.xs,
    },
    label: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },
    input: {
      minHeight: 46,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
    },
    multiline: {
      minHeight: 130,
      textAlignVertical: "top",
      fontFamily: "monospace",
    },
  });
}
