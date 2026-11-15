import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { Category } from "@/types/snippet";
import { AppButton } from "./AppButton";
import { Brand } from "./Brand";
import { Icon, type IconName } from "./Icon";
import { Screen } from "./Screen";
import { ThemeToggle } from "./ThemeToggle";

type AppShellProps = {
  children: ReactNode;
  title: string;
  categories?: Category[];
  selectedCategoryId?: number | null;
  onCategorySelect?: (id: number | null) => void;
};

export function AppShell({
  children,
  title,
  categories,
  selectedCategoryId,
  onCategorySelect,
}: AppShellProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const styles = createStyles(colors);
  const section = pathname.startsWith("/categories")
    ? "categories"
    : pathname === "/account"
      ? "account"
      : "snippets";

  return (
    <Screen>
      <View style={styles.frame}>
        {desktop ? (
          <View style={styles.sidebar}>
            <View style={styles.brand}>
              <Brand />
            </View>
            <View style={styles.workspace}>
              <View style={styles.workspaceIcon}>
                <Icon name="terminal" color={colors.secondary} size={17} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.workspaceName}>Personal workspace</Text>
                <Text style={styles.small}>Your private collection</Text>
              </View>
              <Icon name="lock" color={colors.muted} size={13} />
            </View>
            <Text style={styles.sectionLabel}>WORKSPACE</Text>
            <NavItem
              title="All snippets"
              icon="layers"
              active={section === "snippets" && selectedCategoryId == null}
              onPress={() => {
                if (onCategorySelect) onCategorySelect(null);
                else router.push("/");
              }}
            />
            <NavItem
              title="Categories"
              icon="folder"
              active={section === "categories"}
              onPress={() => router.push("/categories")}
            />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 30 }}>
              {categories?.length ? (
                <>
                  <Text style={styles.sectionLabel}>YOUR CATEGORIES</Text>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedCategoryId === category.id }}
                      onPress={() => onCategorySelect?.(category.id)}
                      style={({ pressed }) => [
                        styles.category,
                        {
                          backgroundColor:
                            selectedCategoryId === category.id
                              ? colors.surfaceAlt
                              : pressed
                                ? colors.surface
                                : "transparent",
                        },
                      ]}
                    >
                      <View
                        style={[styles.dot, { backgroundColor: category.color || colors.accent }]}
                      />
                      <Text numberOfLines={1} style={styles.categoryName}>
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </>
              ) : null}
            </ScrollView>
            <View style={styles.tip}>
              <Icon name="code" color={colors.accent} size={20} />
              <Text style={styles.tipTitle}>A home for your best code.</Text>
              <Text style={styles.tipText}>Save it once. Find it when it matters.</Text>
              <AppButton
                title="Create a snippet"
                icon="plus"
                tone="secondary"
                small
                onPress={() => router.push("/snippets/new")}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open account settings"
              onPress={() => router.push("/account")}
              style={({ pressed }) => [styles.profile, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.email.charAt(0).toUpperCase() || "S"}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.workspaceName}>My account</Text>
                <Text style={styles.small} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
              <Icon name="settings" color={colors.muted} size={17} />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.main}>
          <View style={[styles.topbar, !desktop && { paddingHorizontal: 20 }]}>
            {desktop ? (
              <View style={styles.breadcrumb}>
                <Icon name="home" color={colors.muted} size={15} />
                <Text style={styles.small}>Workspace</Text>
                <Text style={styles.small}>/</Text>
                <Text style={styles.breadcrumbTitle}>{title}</Text>
              </View>
            ) : (
              <Brand />
            )}
            <View style={styles.topActions}>
              {desktop ? (
                <View style={styles.private}>
                  <Icon name="lock" color={colors.muted} size={12} />
                  <Text style={styles.small}>Private workspace</Text>
                </View>
              ) : null}
              <ThemeToggle />
            </View>
          </View>
          <View style={styles.body}>{children}</View>
        </View>
      </View>
      {!desktop ? (
        <View style={styles.mobileNav}>
          <NavItem
            title="Snippets"
            icon="layers"
            active={section === "snippets"}
            mobile
            onPress={() => router.navigate("/")}
          />
          <NavItem
            title="Categories"
            icon="folder"
            active={section === "categories"}
            mobile
            onPress={() => router.navigate("/categories")}
          />
          <NavItem
            title="Account"
            icon="user"
            active={section === "account"}
            mobile
            onPress={() => router.navigate("/account")}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function NavItem({
  title,
  icon,
  active,
  mobile,
  onPress,
}: {
  title: string;
  icon: IconName;
  active?: boolean;
  mobile?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: mobile ? 1 : undefined,
        minHeight: mobile ? 54 : 43,
        flexDirection: mobile ? "column" : "row",
        alignItems: "center",
        justifyContent: mobile ? "center" : "flex-start",
        gap: mobile ? 5 : 11,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor:
          active && !mobile ? colors.accentSoft : pressed ? colors.surfaceAlt : "transparent",
        marginBottom: mobile ? 0 : 4,
      })}
    >
      <Icon name={icon} size={mobile ? 19 : 17} color={active ? colors.accent : colors.muted} />
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: mobile ? 10 : 13,
          fontWeight: active ? "600" : "500",
          color: active ? colors.accent : colors.secondary,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    frame: { flex: 1, flexDirection: "row" },
    sidebar: {
      width: 244,
      paddingHorizontal: 16,
      backgroundColor: colors.sidebar,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    brand: { paddingHorizontal: 10, paddingTop: 28, paddingBottom: 32 },
    workspace: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      padding: 11,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      marginBottom: 30,
    },
    workspaceIcon: {
      width: 30,
      height: 32,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    workspaceName: { fontFamily: fonts.sans, color: colors.text, fontSize: 12, fontWeight: "600" },
    small: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11 },
    sectionLabel: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 9,
      letterSpacing: 1.5,
      fontWeight: "600",
      paddingHorizontal: 14,
      marginBottom: 13,
    },
    category: {
      minHeight: 39,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingHorizontal: 17,
      borderRadius: 7,
    },
    categoryName: { fontFamily: fonts.sans, color: colors.secondary, fontSize: 12, flex: 1 },
    dot: { width: 7, height: 7, borderRadius: 3 },
    tip: {
      gap: 12,
      padding: 16,
      borderRadius: 10,
      borderColor: colors.border,
      borderWidth: 1,
      marginBottom: 20,
    },
    tipTitle: {
      fontFamily: fonts.sans,
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 18,
    },
    tipText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11, lineHeight: 18 },
    profile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingVertical: 20,
      paddingHorizontal: 4,
    },
    avatar: {
      width: 33,
      height: 33,
      borderRadius: 10,
      backgroundColor: colors.accentSoft,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: { fontFamily: fonts.sans, color: colors.accent, fontSize: 13, fontWeight: "600" },
    main: { flex: 1, minWidth: 0 },
    body: { flex: 1 },
    topbar: {
      minHeight: 76,
      paddingHorizontal: 36,
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    breadcrumb: { flexDirection: "row", alignItems: "center", gap: 13 },
    breadcrumbTitle: { fontFamily: fonts.sans, color: colors.secondary, fontSize: 11 },
    topActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    private: { flexDirection: "row", alignItems: "center", gap: 7 },
    mobileNav: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.sidebar,
      paddingTop: 4,
      paddingBottom: 4,
    },
  });
}
