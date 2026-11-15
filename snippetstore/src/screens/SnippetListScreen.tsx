import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import { SnippetCard } from "@/components/SnippetCard";
import { StatePanel } from "@/components/StatePanel";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchCategories, fetchSnippetPage } from "@/services/snippetApi";
import type { Category, Snippet } from "@/types/snippet";
import { getErrorMessage } from "@/utils/errors";
import { useRequireAuth } from "@/utils/useRequireAuth";

export function SnippetListScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const request = useRef(0);
  const columns =
    layout === "list"
      ? 1
      : width >= 1650
        ? 3
        : width >= 1150 || (width >= 720 && width < 1000)
          ? 2
          : 1;

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(
    async (showLoader = true) => {
      if (authLoading || !user) return;
      const version = ++request.current;
      setError(null);
      if (showLoader) setLoading(true);
      setLoadingMore(false);
      try {
        const [categoryData, result] = await Promise.all([
          fetchCategories(),
          fetchSnippetPage({ search: query, categoryId: selectedCategoryId, page: 1 }),
        ]);
        if (version !== request.current) return;
        setCategories(categoryData);
        setSnippets(result.data);
        setTotal(result.meta.total);
        setPage(1);
      } catch (err) {
        if (version === request.current) setError(getErrorMessage(err));
      } finally {
        if (version === request.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query, selectedCategoryId, authLoading, user],
  );

  useFocusEffect(
    useCallback(() => {
      void loadData();
      return () => {
        request.current++;
      };
    }, [loadData]),
  );

  const loadMore = async () => {
    if (loadingMore || loading || snippets.length >= total) return;
    const version = request.current;
    setLoadingMore(true);
    try {
      const result = await fetchSnippetPage({
        search: query,
        categoryId: selectedCategoryId,
        page: page + 1,
      });
      if (version !== request.current) return;
      setSnippets((current) => [...current, ...result.data]);
      setPage((current) => current + 1);
      setTotal(result.meta.total);
    } catch (err) {
      if (version === request.current) setError(getErrorMessage(err));
    } finally {
      if (version === request.current) setLoadingMore(false);
    }
  };
  const filtered = !!query || selectedCategoryId !== null;
  const selectedName = categories.find((category) => category.id === selectedCategoryId)?.name;
  const newSnippet = () => router.push("/snippets/new");

  return (
    <AppShell
      title="Snippet library"
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      onCategorySelect={setSelectedCategoryId}
    >
      <View style={[styles.container, { paddingHorizontal: width < 650 ? 20 : 36 }]}>
        <FlatList
          key={columns}
          data={loading || error ? [] : snippets}
          numColumns={columns}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          columnWrapperStyle={columns > 1 ? { gap: 16 } : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadData(false);
              }}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <PageHeading
                eyebrow="YOUR DEVELOPER TOOLBOX"
                title="Your snippet library"
                description="Less searching. More building. Keep your best code close."
                action={
                  <AppButton
                    title="New snippet"
                    icon="plus"
                    onPress={newSnippet}
                    style={width < 650 ? { alignSelf: "flex-start" } : undefined}
                  />
                }
              />
              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Icon name="code" size={14} color={colors.accent} />
                  <Text style={styles.summaryText}>
                    {loading ? "…" : total} {filtered ? "matching" : "saved"} snippets
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Icon name="folder" size={14} color={colors.muted} />
                  <Text style={styles.summaryText}>{categories.length} categories</Text>
                </View>
                {width >= 650 ? (
                  <View style={styles.summaryItem}>
                    <Icon name="lock" size={13} color={colors.muted} />
                    <Text style={styles.summaryText}>Yours, privately</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.searchRow}>
                <View style={{ flex: 1 }}>
                  <AppTextInput
                    label="Search snippets"
                    hideLabel
                    icon="search"
                    value={search}
                    onChangeText={setSearch}
                    placeholder={
                      width < 500
                        ? "Search your snippets…"
                        : "Search by title, code, language, or project…"
                    }
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={() => setQuery(search.trim())}
                  />
                </View>
                {search ? (
                  <AppButton
                    title="Clear"
                    tone="ghost"
                    onPress={() => {
                      setSearch("");
                      setQuery("");
                    }}
                  />
                ) : null}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                <CategoryPill
                  label="All snippets"
                  active={selectedCategoryId === null}
                  onPress={() => setSelectedCategoryId(null)}
                />
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
              <View style={styles.resultsBar}>
                <View style={styles.summaryItem}>
                  <Text accessibilityRole="header" style={styles.resultsTitle}>
                    {query ? "Search results" : selectedName || "All snippets"}
                  </Text>
                  <View style={styles.count}>
                    <Text style={styles.countText}>{loading ? "…" : total}</Text>
                  </View>
                </View>
                <View style={styles.summaryItem}>
                  {width > 500 ? <Text style={styles.sortLabel}>Recently updated</Text> : null}
                  <View style={styles.layoutToggle}>
                    {(["grid", "list"] as const).map((value) => (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${value} view`}
                        accessibilityState={{ selected: layout === value }}
                        onPress={() => setLayout(value)}
                        style={[
                          styles.layoutButton,
                          layout === value && { backgroundColor: colors.surfaceAlt },
                        ]}
                      >
                        <Icon
                          name={value}
                          size={15}
                          color={layout === value ? colors.text : colors.muted}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            loading || authLoading ? (
              <StatePanel
                loading
                title="Opening your library"
                description="Getting your snippets ready."
              />
            ) : error ? (
              <StatePanel
                icon="cloud-off"
                title="Your library couldn’t load"
                description={error}
                action="Try again"
                onAction={() => void loadData()}
              />
            ) : (
              <StatePanel
                icon={filtered ? "search" : "code"}
                title={filtered ? "No matching snippets" : "Great code deserves a place to stay."}
                description={
                  filtered
                    ? "Try another search or choose a different category."
                    : "Save your first snippet. A useful function, a go-to command, that config you always forget."
                }
                action={filtered ? "Clear filters" : "Create your first snippet"}
                onAction={
                  filtered
                    ? () => {
                        setSearch("");
                        setQuery("");
                        setSelectedCategoryId(null);
                      }
                    : newSnippet
                }
              />
            )
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: columns > 1 ? `${100 / columns}%` : undefined }}>
              <SnippetCard
                snippet={item}
                compact={layout === "list"}
                onPress={() => router.push({ pathname: "/snippets/[id]", params: { id: item.id } })}
              />
            </View>
          )}
          ListFooterComponent={
            !loading && !error && snippets.length ? (
              <View style={styles.footer}>
                {snippets.length < total ? (
                  <AppButton
                    title={loadingMore ? "Loading…" : "Load more snippets"}
                    tone="secondary"
                    loading={loadingMore}
                    onPress={loadMore}
                  />
                ) : (
                  <>
                    <Icon name="check-circle" size={13} color={colors.muted} />
                    <Text style={styles.footerText}>
                      You’re all caught up. Go build something great.
                    </Text>
                  </>
                )}
              </View>
            ) : null
          }
        />
      </View>
    </AppShell>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, width: "100%", maxWidth: 1480, alignSelf: "center" },
    list: { paddingTop: 36, paddingBottom: 28, gap: 16, flexGrow: 1 },
    listHeader: { gap: 24, marginBottom: 2 },
    summary: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 24,
      paddingBottom: 6,
    },
    summaryItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    summaryText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11 },
    searchRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    categoryRow: { gap: 8, paddingBottom: 2 },
    resultsBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 22,
    },
    resultsTitle: { fontFamily: fonts.sans, color: colors.text, fontSize: 13, fontWeight: "600" },
    count: {
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    countText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
    sortLabel: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10, marginRight: 8 },
    layoutToggle: {
      flexDirection: "row",
      gap: 2,
      padding: 3,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    layoutButton: {
      width: 31,
      height: 29,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      paddingVertical: 24,
    },
    footerText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
  });
}
