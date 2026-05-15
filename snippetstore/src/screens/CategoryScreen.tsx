import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { Screen } from "@/components/Screen";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { createCategory, deleteCategory, fetchCategories } from "@/services/snippetApi";
import type { Category } from "@/types/snippet";
import { getErrorMessage } from "@/utils/errors";

export function CategoryScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setCategories(await fetchCategories());
    } catch (err) {
      Alert.alert("Could not load categories", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Category name is required.");
      return;
    }

    try {
      setSaving(true);
      await createCategory({ name: name.trim(), description: description.trim() || null });
      setName("");
      setDescription("");
      await loadCategories();
    } catch (err) {
      Alert.alert("Could not create category", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = (category: Category) => {
    Alert.alert("Delete category?", "Snippets in this category will become uncategorized.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCategory(category.id);
            await loadCategories();
          } catch (err) {
            Alert.alert("Could not delete category", getErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.form}>
          <AppTextInput label="Name" value={name} onChangeText={setName} placeholder="API Request" />
          <AppTextInput
            label="Note"
            value={description}
            onChangeText={setDescription}
            placeholder="What this category is for"
          />
          <AppButton title={saving ? "Adding..." : "Add category"} onPress={addCategory} disabled={saving} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.categoryCard}>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  {item.description ? <Text style={styles.categoryDescription}>{item.description}</Text> : null}
                </View>
                <AppButton title="Delete" tone="danger" onPress={() => removeCategory(item)} />
              </View>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flex: 1,
      gap: spacing.md,
      padding: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    form: {
      gap: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    center: {
      paddingVertical: spacing.xl,
    },
    list: {
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    categoryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    categoryText: {
      flex: 1,
      gap: spacing.xs,
    },
    categoryName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    categoryDescription: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
