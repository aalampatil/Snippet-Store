import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import type { Snippet } from "@/types/snippet";
import { CodeBlock } from "./CodeBlock";
import { Icon } from "./Icon";

const languageColors: Record<string, string> = {
  ts: "#79B8FF",
  typescript: "#79B8FF",
  js: "#E9D379",
  javascript: "#E9D379",
  python: "#82C8A5",
  py: "#82C8A5",
  css: "#BCA0E6",
  html: "#E7A07C",
  sql: "#82C8DD",
  bash: "#A1BCB3",
  shell: "#A1BCB3",
  yaml: "#E19BAF",
  json: "#E9D379",
};
export function SnippetCard({
  snippet,
  onPress,
  compact = false,
}: {
  snippet: Snippet;
  onPress: () => void;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const updated = new Date(snippet.updatedAt);
  const date = Number.isNaN(updated.getTime())
    ? ""
    : updated.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(snippet.content);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open snippet: ${snippet.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.open, pressed && { opacity: 0.75 }]}
      >
        <View style={styles.header}>
          <View style={[styles.fileIcon, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="file-text" size={17} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
            <Text style={styles.title} numberOfLines={1}>
              {snippet.title}
            </Text>
            <Text style={styles.note} numberOfLines={1}>
              {snippet.note || "A little code, ready when you need it."}
            </Text>
          </View>
          <Icon name="arrow-up-right" color={colors.muted} size={16} />
        </View>
        {!compact ? <CodeBlock content={snippet.content} preview /> : null}
      </Pressable>
      <View style={styles.footer}>
        <View style={styles.meta}>
          <View
            style={[
              styles.languageDot,
              {
                backgroundColor:
                  languageColors[snippet.language?.toLowerCase() || ""] || colors.accent,
              },
            ]}
          />
          <Text style={styles.language} numberOfLines={1}>
            {snippet.language || "Plain text"}
          </Text>
          {snippet.category ? (
            <View style={styles.category}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {snippet.category.name}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text style={styles.date}>{date}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copy ${snippet.title}`}
            onPress={copy}
            style={({ pressed }) => [
              styles.copy,
              pressed && { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Icon
              name={copied ? "check" : copyError ? "alert-circle" : "copy"}
              color={copied ? colors.accent : copyError ? colors.danger : colors.muted}
              size={14}
            />
          </Pressable>
        </View>
      </View>
      {copied || copyError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.feedback, { color: copyError ? colors.danger : colors.accent }]}
        >
          {copyError ? "Could not copy. Open the snippet and try again." : "Copied to clipboard"}
        </Text>
      ) : null}
    </View>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    open: { overflow: "hidden" },
    header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18 },
    fileIcon: {
      width: 36,
      height: 38,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: fonts.sans,
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    note: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11, lineHeight: 17 },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 8,
      paddingLeft: 18,
      paddingRight: 10,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    meta: { flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 1, minWidth: 0 },
    languageDot: { width: 6, height: 6, borderRadius: 3 },
    language: { fontFamily: fonts.sans, color: colors.secondary, fontSize: 10, maxWidth: 90 },
    category: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 4,
      maxWidth: 100,
      flexShrink: 1,
    },
    categoryText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 9 },
    date: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
    copy: {
      minWidth: 34,
      minHeight: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
    },
    feedback: { fontFamily: fonts.sans, fontSize: 10, paddingHorizontal: 18, paddingBottom: 10 },
  });
}
