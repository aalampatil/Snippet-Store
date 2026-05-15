import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import type { Snippet } from "@/types/snippet";

type SnippetCardProps = {
  snippet: Snippet;
  onPress: () => void;
};

export function SnippetCard({ snippet, onPress }: SnippetCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {snippet.title}
        </Text>
        {snippet.category ? (
          <Text style={styles.category} numberOfLines={1}>
            {snippet.category.name}
          </Text>
        ) : null}
      </View>

      {snippet.note ? (
        <Text style={styles.note} numberOfLines={2}>
          {snippet.note}
        </Text>
      ) : null}

      <Text style={styles.code} numberOfLines={3}>
        {snippet.content}
      </Text>

      <View style={styles.metaRow}>
        {snippet.language ? <Text style={styles.meta}>{snippet.language}</Text> : null}
        {snippet.project ? <Text style={styles.meta}>{snippet.project}</Text> : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    pressed: {
      opacity: 0.86,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
    },
    category: {
      maxWidth: 132,
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    note: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    code: {
      borderRadius: 8,
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: "monospace",
      fontSize: 13,
      lineHeight: 18,
      padding: spacing.sm,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    meta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
