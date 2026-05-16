import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { deleteSnippet, fetchSnippet } from "@/services/snippetApi";
import type { Snippet } from "@/types/snippet";
import { getErrorMessage } from "@/utils/errors";
import { useRequireAuth } from "@/utils/useRequireAuth";

type SnippetDetailScreenProps = {
  snippetId: number;
};

export function SnippetDetailScreen({ snippetId }: SnippetDetailScreenProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);

  if (authLoading || !user) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  const loadSnippet = useCallback(async () => {
    try {
      setLoading(true);
      setSnippet(await fetchSnippet(snippetId));
    } catch (err) {
      Alert.alert("Could not load snippet", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [snippetId]);

  useFocusEffect(
    useCallback(() => {
      loadSnippet();
    }, [loadSnippet]),
  );

  const remove = () => {
    Alert.alert("Delete snippet?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSnippet(snippetId);
            router.replace("/");
          } catch (err) {
            Alert.alert("Could not delete snippet", getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const share = async () => {
    if (!snippet) {
      return;
    }

    await Share.share({ message: snippet.content, title: snippet.title });
  };

  const copySnippet = async () => {
    if (!snippet) {
      return;
    }

    await Clipboard.setStringAsync(snippet.content);
    Alert.alert("Copied", "Snippet copied to clipboard.");
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!snippet) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>Snippet not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.category}>{snippet.category?.name ?? "Uncategorized"}</Text>
            <Text style={styles.title}>{snippet.title}</Text>
          </View>
          <AppButton
            title="Edit"
            onPress={() => router.push({ pathname: "/snippets/[id]/edit", params: { id: snippet.id } })}
          />
        </View>

        {snippet.note ? <Text style={styles.note}>{snippet.note}</Text> : null}

        <View style={styles.metaRow}>
          {snippet.language ? <Text style={styles.meta}>{snippet.language}</Text> : null}
          {snippet.project ? <Text style={styles.meta}>{snippet.project}</Text> : null}
        </View>

        <Text selectable style={styles.code}>
          {snippet.content}
        </Text>

        <View style={styles.actions}>
          <AppButton title="Copy" onPress={copySnippet} />
          <AppButton title="Share" tone="secondary" onPress={share} />
          <AppButton title="Delete" tone="danger" onPress={remove} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      gap: spacing.md,
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    titleBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    category: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: "900",
    },
    note: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    meta: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.muted,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      fontSize: 12,
      fontWeight: "800",
    },
    code: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      fontFamily: "monospace",
      fontSize: 14,
      lineHeight: 21,
      padding: spacing.md,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    muted: {
      color: colors.muted,
    },
  });
}
