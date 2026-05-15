import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { CategoryPill } from "@/components/CategoryPill";
import { Screen } from "@/components/Screen";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { createSnippet, fetchCategories, fetchSnippet, updateSnippet } from "@/services/snippetApi";
import type { Category, SnippetPayload } from "@/types/snippet";
import { getErrorMessage } from "@/utils/errors";

type SnippetFormScreenProps = {
  snippetId?: number;
};

export function SnippetFormScreen({ snippetId }: SnippetFormScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [project, setProject] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(snippetId));
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const categoryData = await fetchCategories();
      setCategories(categoryData);

      if (snippetId) {
        const snippet = await fetchSnippet(snippetId);
        setTitle(snippet.title);
        setNote(snippet.note ?? "");
        setContent(snippet.content);
        setLanguage(snippet.language ?? "");
        setProject(snippet.project ?? "");
        setCategoryId(snippet.categoryId);
      } else if (categoryData[0]) {
        setCategoryId(categoryData[0].id);
      }
    } catch (err) {
      Alert.alert("Could not load form", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [snippetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const save = async () => {
    const payload: SnippetPayload = {
      title: title.trim(),
      note: note.trim() || null,
      content: content.trim(),
      language: language.trim() || null,
      project: project.trim() || null,
      categoryId,
    };

    if (!payload.title || !payload.content) {
      Alert.alert("Missing details", "Title and snippet content are required.");
      return;
    }

    try {
      setSaving(true);
      const saved = snippetId ? await updateSnippet(snippetId, payload) : await createSnippet(payload);
      router.replace({ pathname: "/snippets/[id]", params: { id: saved.id } });
    } catch (err) {
      Alert.alert("Could not save snippet", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{snippetId ? "Edit snippet" : "New snippet"}</Text>
          <AppButton title="Categories" tone="secondary" onPress={() => router.push("/categories/index")} />
        </View>

        <AppTextInput label="Title" value={title} onChangeText={setTitle} placeholder="Docker compose for Postgres" />
        <AppTextInput label="Note" value={note} onChangeText={setNote} placeholder="What this is for" multiline />

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                color={category.color}
                active={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <AppTextInput label="Language" value={language} onChangeText={setLanguage} placeholder="ts, bash, yaml" />
          </View>
          <View style={styles.inlineField}>
            <AppTextInput label="Project" value={project} onChangeText={setProject} placeholder="optional" />
          </View>
        </View>

        <AppTextInput
          label="Snippet"
          value={content}
          onChangeText={setContent}
          placeholder="Paste code, commands, or config here"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.codeInput}
        />

        <View style={styles.actions}>
          <AppButton title="Cancel" tone="secondary" onPress={() => router.back()} disabled={saving} />
          <AppButton title={saving ? "Saving..." : "Save"} onPress={save} disabled={saving} />
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
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    field: {
      gap: spacing.xs,
    },
    label: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },
    categoryRow: {
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    inlineFields: {
      flexDirection: "row",
      gap: spacing.md,
    },
    inlineField: {
      flex: 1,
    },
    codeInput: {
      minHeight: 240,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
  });
}
