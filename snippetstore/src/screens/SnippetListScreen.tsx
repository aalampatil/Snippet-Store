import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { CategoryPill } from "@/components/CategoryPill";
import { Screen } from "@/components/Screen";
import { SnippetCard } from "@/components/SnippetCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchCategories, fetchSnippets } from "@/services/snippetApi";
import type { Category, Snippet } from "@/types/snippet";
import { getErrorMessage } from "@/utils/errors";

export function SnippetListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (showLoader = false) => {
      try {
        setError(null);
        if (showLoader) {
          setLoading(true);
        }
        const [categoryData, snippetData] = await Promise.all([
          fetchCategories(),
          fetchSnippets({ search, categoryId: selectedCategoryId }),
        ]);
        setCategories(categoryData);
        setSnippets(snippetData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, selectedCategoryId],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Snippet Store</Text>
          <Text style={styles.title}>Personal code shelf</Text>
        </View>
        <ThemeToggle />
        <AppButton title="New" onPress={() => router.push("/snippets/new")} />
      </View>

      <View style={styles.filters}>
        <AppTextInput
          label="Search"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadData(true)}
          placeholder="Search title, note, command, config..."
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <CategoryPill label="All" active={selectedCategoryId === null} onPress={() => setSelectedCategoryId(null)} />
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              color={category.color}
              active={selectedCategoryId === category.id}
              onPress={() => setSelectedCategoryId(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={snippets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No snippets yet</Text>
              <Text style={styles.emptyText}>Add code, commands, or project config notes you reuse often.</Text>
              <AppButton title="Create snippet" onPress={() => router.push("/snippets/new")} />
            </View>
          }
          renderItem={({ item }) => (
            <SnippetCard snippet={item} onPress={() => router.push({ pathname: "/snippets/[id]", params: { id: item.id } })} />
          )}
        />
      )}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      padding: spacing.md,
      paddingBottom: spacing.sm,
    },
    titleBlock: {
      flex: 1,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    filters: {
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    categoryRow: {
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    list: {
      gap: spacing.md,
      padding: spacing.md,
      paddingTop: 0,
      flexGrow: 1,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    error: {
      color: colors.danger,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingVertical: 80,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    emptyText: {
      maxWidth: 280,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
