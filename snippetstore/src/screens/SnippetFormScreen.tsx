import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppShell } from "@/components/AppShell";
import { AppTextInput } from "@/components/AppTextInput";
import { CategoryPill } from "@/components/CategoryPill";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatePanel } from "@/components/StatePanel";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { createSnippet, fetchCategories, fetchSnippet, updateSnippet } from "@/services/snippetApi";
import type { Category, SnippetPayload } from "@/types/snippet";
import { getErrorMessage } from "@/utils/errors";
import { useRequireAuth } from "@/utils/useRequireAuth";

export function SnippetFormScreen({ snippetId }: { snippetId?: number }) {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [project, setProject] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const initialized = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user) return;
      let active = true;
      if (!initialized.current) setLoading(true);
      setLoadError(null);
      void Promise.all([
        fetchCategories(),
        snippetId && !initialized.current ? fetchSnippet(snippetId) : Promise.resolve(null),
      ])
        .then(([categoryData, snippet]) => {
          if (!active) return;
          initialized.current = true;
          setCategories(categoryData);
          setCategoryId((current) =>
            categoryData.some((category) => category.id === current) ? current : null,
          );
          if (snippet) {
            setTitle(snippet.title);
            setNote(snippet.note ?? "");
            setContent(snippet.content);
            setLanguage(snippet.language ?? "");
            setProject(snippet.project ?? "");
            setCategoryId(snippet.categoryId);
          }
        })
        .catch((err) => {
          if (active) setLoadError(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [snippetId, authLoading, user, retry]),
  );

  const save = async () => {
    if (saving) return;
    const payload: SnippetPayload = {
      title: title.trim(),
      note: note.trim() || null,
      content,
      language: language.trim() || null,
      project: project.trim() || null,
      categoryId,
    };
    if (!payload.title || !payload.content.trim()) {
      setError("Give your snippet a title and add some code before saving.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const saved = snippetId
        ? await updateSnippet(snippetId, payload)
        : await createSnippet(payload);
      router.replace({ pathname: "/snippets/[id]", params: { id: saved.id } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <AppShell title={snippetId ? "Edit snippet" : "New snippet"}>
      {loading || authLoading ? (
        <StatePanel loading title="Preparing your editor" />
      ) : loadError ? (
        <StatePanel
          icon="cloud-off"
          title="The editor couldn’t load"
          description={loadError}
          action="Try again"
          onAction={() => setRetry((current) => current + 1)}
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { padding: width < 650 ? 20 : 36 }]}
          >
            <AppButton
              title="Back to library"
              tone="ghost"
              icon="arrow-left"
              onPress={cancel}
              style={{ alignSelf: "flex-start", marginLeft: -16 }}
            />
            <PageHeading
              eyebrow="MAKE IT REUSABLE"
              title={snippetId ? "Refine your snippet" : "Save something useful."}
              description="A handy function, a clever solution, a command worth keeping."
            />
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <View style={[styles.columns, width < 1150 && { flexDirection: "column" }]}>
              <View style={styles.main}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>The essentials</Text>
                  <AppTextInput
                    label="Snippet title"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Fetch with automatic retries"
                    editable={!saving}
                  />
                  <AppTextInput
                    label="Description (optional)"
                    value={note}
                    onChangeText={setNote}
                    placeholder="A little context for your future self…"
                    multiline
                    editable={!saving}
                  />
                </View>
                <View style={styles.codePanel}>
                  <View style={styles.codeHeader}>
                    <View style={styles.row}>
                      <Icon name="code" color={colors.accent} size={17} />
                      <Text style={styles.panelTitle}>Code</Text>
                    </View>
                    <Text style={styles.codeMeta}>{content.split("\n").length} lines</Text>
                  </View>
                  <View style={{ padding: 16 }}>
                    <AppTextInput
                      label="Snippet"
                      hideLabel
                      code
                      value={content}
                      onChangeText={setContent}
                      placeholder="// Your next useful snippet starts here…"
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      editable={!saving}
                      style={styles.codeInput}
                    />
                  </View>
                  <View style={styles.codeFooter}>
                    <Icon name="lock" color={colors.muted} size={12} />
                    <Text style={styles.help}>Only you can access this snippet.</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.side, width < 1150 && { width: "100%" }]}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Organization</Text>
                  <AppTextInput
                    label="Language (optional)"
                    value={language}
                    onChangeText={setLanguage}
                    placeholder="e.g. TypeScript"
                    autoCapitalize="none"
                    editable={!saving}
                  />
                  <AppTextInput
                    label="Project (optional)"
                    value={project}
                    onChangeText={setProject}
                    placeholder="e.g. Personal website"
                    editable={!saving}
                  />
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categories}>
                    <CategoryPill
                      label="Uncategorized"
                      active={categoryId === null}
                      onPress={() => !saving && setCategoryId(null)}
                    />
                    {categories.map((category) => (
                      <CategoryPill
                        key={category.id}
                        label={category.name}
                        color={category.color}
                        active={categoryId === category.id}
                        onPress={() => !saving && setCategoryId(category.id)}
                      />
                    ))}
                  </View>
                  <AppButton
                    title="Manage categories"
                    tone="ghost"
                    icon="folder-plus"
                    small
                    disabled={saving}
                    onPress={() => router.push("/categories")}
                    style={{ alignSelf: "flex-start", marginLeft: -10 }}
                  />
                </View>
                <View style={styles.hint}>
                  <Icon name="zap" color={colors.accent} size={17} />
                  <Text style={styles.hintText}>
                    A descriptive title and a little context make the right snippet easier to find
                    later.
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <AppButton title="Cancel" tone="secondary" onPress={cancel} disabled={saving} />
              <AppButton
                title={saving ? "Saving…" : "Save snippet"}
                icon="check"
                loading={saving}
                onPress={save}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </AppShell>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { width: "100%", maxWidth: 1360, alignSelf: "center", gap: 25, paddingBottom: 40 },
    columns: { flexDirection: "row", alignItems: "flex-start", gap: 22 },
    main: { flex: 1, gap: 22, width: "100%", minWidth: 0 },
    side: { width: 270, gap: 20 },
    panel: {
      padding: 22,
      gap: 21,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    panelTitle: { fontFamily: fonts.sans, color: colors.text, fontSize: 13, fontWeight: "600" },
    label: {
      fontFamily: fonts.sans,
      color: colors.secondary,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: -9,
    },
    categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    codePanel: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    codeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 18,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 9 },
    codeMeta: { fontFamily: fonts.mono, color: colors.muted, fontSize: 10 },
    codeInput: { minHeight: 300, fontSize: 12, lineHeight: 23 },
    codeFooter: {
      flexDirection: "row",
      gap: 7,
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 18,
    },
    help: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
    hint: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 8 },
    hintText: {
      flex: 1,
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 21,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 22,
    },
    error: { fontFamily: fonts.sans, color: colors.danger, fontSize: 13, lineHeight: 21 },
  });
}
