import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppShell } from "@/components/AppShell";
import { AppTextInput } from "@/components/AppTextInput";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatePanel } from "@/components/StatePanel";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { createCategory, deleteCategory, fetchCategories } from "@/services/snippetApi";
import type { Category } from "@/types/snippet";
import { confirmAction } from "@/utils/confirm";
import { getErrorMessage } from "@/utils/errors";
import { useRequireAuth } from "@/utils/useRequireAuth";

const categoryColors = [
  { name: "Mint", value: "#8CE5C0" },
  { name: "Blue", value: "#79B8FF" },
  { name: "Purple", value: "#BCA0E6" },
  { name: "Amber", value: "#E7C383" },
  { name: "Rose", value: "#E49BB4" },
  { name: "Coral", value: "#E7A07C" },
];

export function CategoryScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const { user, loading: authLoading } = useRequireAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(categoryColors[0].value);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user) return;
      let active = true;
      setLoading(true);
      setError(null);
      void fetchCategories()
        .then((result) => {
          if (active) setCategories(result);
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
    }, [authLoading, user, retry]),
  );

  const addCategory = async () => {
    if (saving) return;
    if (!name.trim()) {
      setError("Give your category a name.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const category = await createCategory({
        name: name.trim(),
        description: description.trim() || null,
        color,
      });
      setCategories((current) => [...current, category]);
      setNotice(`“${category.name}” is ready for your snippets.`);
      setName("");
      setDescription("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const removeCategory = (category: Category) =>
    confirmAction(
      "Delete category?",
      "Your snippets will be kept and become uncategorized.",
      "Delete",
      () => {
        setDeletingId(category.id);
        setError(null);
        setNotice(null);
        void deleteCategory(category.id)
          .then(() => setCategories((current) => current.filter((item) => item.id !== category.id)))
          .catch((err) => setError(getErrorMessage(err)))
          .finally(() => setDeletingId(null));
      },
    );

  return (
    <AppShell title="Categories">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { padding: width < 650 ? 20 : 36 }]}
      >
        <PageHeading
          eyebrow="A LITTLE ORDER GOES A LONG WAY"
          title="Everything in its place."
          description="Group your snippets by what makes sense to you. Find your way back faster."
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
        <View style={[styles.columns, width < 1200 && { flexDirection: "column" }]}>
          <View style={styles.collection}>
            <View style={styles.collectionHeader}>
              <Text style={styles.panelTitle}>Your categories</Text>
              <Text style={styles.count}>{categories.length} total</Text>
            </View>
            {loading || authLoading ? (
              <StatePanel loading title="Loading categories" />
            ) : !categories.length ? (
              <StatePanel
                icon="folder-plus"
                title="Start with a little structure."
                description="Create a category for your functions, commands, configs, or anything you come back to."
              />
            ) : (
              categories.map((category) => (
                <View key={category.id} style={styles.category}>
                  <View style={[styles.folder, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon name="folder" color={category.color || colors.accent} size={22} />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description || "Ready for your next useful snippet."}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${category.name} category`}
                    disabled={deletingId !== null}
                    onPress={() => removeCategory(category)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && { backgroundColor: colors.dangerSoft },
                      deletingId === category.id && { opacity: 0.4 },
                    ]}
                  >
                    <Icon name="trash-2" color={colors.muted} size={16} />
                  </Pressable>
                </View>
              ))
            )}
            {!loading && error && !categories.length ? (
              <AppButton
                title="Try again"
                tone="secondary"
                onPress={() => setRetry((current) => current + 1)}
                style={{ margin: 18 }}
              />
            ) : null}
          </View>
          <View style={[styles.form, width < 1200 && { width: "100%" }]}>
            <View style={styles.formHeading}>
              <View style={styles.formIcon}>
                <Icon name="folder-plus" color={colors.accent} size={20} />
              </View>
              <Text style={styles.panelTitle}>Create a category</Text>
            </View>
            <AppTextInput
              label="Category name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. API essentials"
              editable={!saving}
            />
            <AppTextInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What belongs here?"
              multiline
              editable={!saving}
            />
            <View style={{ gap: 11 }}>
              <Text style={styles.label}>Category color</Text>
              <View style={styles.colorRow}>
                {categoryColors.map((item) => (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} category color`}
                    accessibilityState={{ selected: color === item.value }}
                    disabled={saving}
                    onPress={() => setColor(item.value)}
                    style={[
                      styles.colorChoice,
                      { borderColor: color === item.value ? colors.text : "transparent" },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: item.value }]}>
                      {color === item.value ? (
                        <Icon name="check" color="#17251F" size={14} />
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
            <AppButton
              title={saving ? "Creating…" : "Create category"}
              icon="plus"
              loading={saving}
              onPress={addCategory}
            />
            <View style={styles.hint}>
              <Icon name="info" color={colors.muted} size={13} />
              <Text style={styles.hintText}>Deleting a category always keeps your snippets.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { width: "100%", maxWidth: 1300, alignSelf: "center", gap: 30, paddingBottom: 40 },
    columns: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
    collection: {
      flex: 1,
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    collectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 22,
    },
    panelTitle: { fontFamily: fonts.sans, color: colors.text, fontSize: 14, fontWeight: "600" },
    count: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11 },
    category: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 18,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    folder: {
      width: 44,
      height: 44,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryText: { flex: 1, gap: 5, minWidth: 0 },
    categoryName: { fontFamily: fonts.sans, color: colors.text, fontSize: 13, fontWeight: "600" },
    categoryDescription: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 18,
    },
    deleteButton: {
      minWidth: 40,
      minHeight: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    form: {
      width: 335,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 23,
      backgroundColor: colors.surface,
      gap: 22,
    },
    formHeading: { flexDirection: "row", alignItems: "center", gap: 11 },
    formIcon: {
      width: 37,
      height: 37,
      borderRadius: 10,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { fontFamily: fonts.sans, color: colors.secondary, fontSize: 12, fontWeight: "600" },
    colorRow: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
    colorChoice: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      borderWidth: 1,
    },
    colorDot: {
      width: 25,
      height: 25,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    hint: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
    hintText: {
      flex: 1,
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 17,
    },
    error: { fontFamily: fonts.sans, color: colors.danger, fontSize: 12, lineHeight: 20 },
    notice: { fontFamily: fonts.sans, color: colors.accent, fontSize: 12, lineHeight: 20 },
  });
}
