import { useCallback, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppShell } from "@/components/AppShell";
import { CodeBlock } from "@/components/CodeBlock";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatePanel } from "@/components/StatePanel";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { deleteSnippet, fetchSnippet } from "@/services/snippetApi";
import type { Snippet } from "@/types/snippet";
import { confirmAction } from "@/utils/confirm";
import { getErrorMessage } from "@/utils/errors";
import { useRequireAuth } from "@/utils/useRequireAuth";

export function SnippetDetailScreen({ snippetId }: { snippetId: number }) {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user) return;
      let active = true;
      setLoading(true);
      setError(null);
      setCopied(false);
      void fetchSnippet(snippetId)
        .then((result) => {
          if (active) setSnippet(result);
        })
        .catch((err) => {
          if (active) setError(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [snippetId, authLoading, user, retry]),
  );

  const remove = () =>
    confirmAction(
      "Delete snippet?",
      "This snippet will be permanently removed from your library.",
      "Delete",
      () => {
        setDeleting(true);
        void deleteSnippet(snippetId)
          .then(() => router.replace("/"))
          .catch((err) => {
            setNotice(getErrorMessage(err));
            setDeleting(false);
          });
      },
    );
  const copy = async () => {
    if (!snippet) return;
    try {
      await Clipboard.setStringAsync(snippet.content);
      setCopied(true);
      setNotice("Copied to clipboard. Ready to put to work.");
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  };
  const share = async () => {
    if (!snippet) return;
    try {
      await Share.share({ message: snippet.content, title: snippet.title });
    } catch {
      setNotice("Sharing isn’t available here. Use Copy code to share your snippet.");
    }
  };
  return (
    <AppShell title="Snippet details">
      {loading || authLoading ? (
        <StatePanel loading title="Opening your snippet" />
      ) : error || !snippet ? (
        <StatePanel
          icon="file-text"
          title="This snippet couldn’t load"
          description={error || "The snippet may have been removed."}
          action="Try again"
          onAction={() => setRetry((current) => current + 1)}
        />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { padding: width < 650 ? 20 : 36 }]}>
          <AppButton
            title="Back to library"
            tone="ghost"
            icon="arrow-left"
            onPress={() => router.replace("/")}
            style={{ alignSelf: "flex-start", marginLeft: -16 }}
          />
          <PageHeading
            eyebrow={snippet.category?.name.toUpperCase() || "YOUR COLLECTION"}
            title={snippet.title}
            description={snippet.note || "A useful piece of code, ready for your next project."}
            action={
              <AppButton
                title="Edit snippet"
                icon="edit-2"
                tone="secondary"
                onPress={() =>
                  router.push({ pathname: "/snippets/[id]/edit", params: { id: snippet.id } })
                }
                style={{ alignSelf: "flex-start" }}
              />
            }
          />
          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <Icon name="code" color={colors.accent} size={14} />
              <Text style={styles.metaText}>{snippet.language || "Plain text"}</Text>
            </View>
            {snippet.project ? (
              <View style={styles.metaItem}>
                <Icon name="folder" color={colors.muted} size={14} />
                <Text style={styles.metaText}>{snippet.project}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Icon name="clock" color={colors.muted} size={13} />
              <Text style={styles.metaText}>
                Updated{" "}
                {new Date(snippet.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
          <View style={styles.codePanel}>
            <View style={styles.codeHeader}>
              <View style={styles.metaItem}>
                <Icon name="file-text" color={colors.muted} size={15} />
                <Text style={styles.codeTitle}>{snippet.language || "Snippet"}</Text>
              </View>
              <AppButton
                title={copied ? "Copied!" : "Copy code"}
                icon={copied ? "check" : "copy"}
                tone="secondary"
                small
                onPress={copy}
              />
            </View>
            <CodeBlock content={snippet.content} />
            <View style={styles.codeFooter}>
              <Text style={styles.lineCount}>{snippet.content.split("\n").length} lines</Text>
              <View style={styles.metaItem}>
                <Icon name="lock" color={colors.muted} size={11} />
                <Text style={styles.lineCount}>Private snippet</Text>
              </View>
            </View>
          </View>
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>
              {notice}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <AppButton
              title="Delete snippet"
              tone="danger"
              icon="trash-2"
              onPress={remove}
              loading={deleting}
            />
            <View style={{ flex: 1 }} />
            <AppButton title="Share" tone="secondary" icon="share-2" onPress={share} />
          </View>
        </ScrollView>
      )}
    </AppShell>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { width: "100%", maxWidth: 1200, alignSelf: "center", gap: 26, paddingBottom: 40 },
    metadata: { flexDirection: "row", flexWrap: "wrap", gap: 22 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    metaText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11 },
    codePanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    codeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 15,
      borderBottomWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    codeTitle: { fontFamily: fonts.mono, color: colors.secondary, fontSize: 11 },
    codeFooter: {
      borderTopWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 15,
    },
    lineCount: { fontFamily: fonts.mono, color: colors.muted, fontSize: 10 },
    notice: { fontFamily: fonts.sans, color: colors.secondary, fontSize: 12, lineHeight: 20 },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 10,
      paddingTop: 4,
    },
  });
}
