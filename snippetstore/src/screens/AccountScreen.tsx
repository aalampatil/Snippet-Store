import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AppButton } from "@/components/AppButton";
import { AppShell } from "@/components/AppShell";
import { AppTextInput } from "@/components/AppTextInput";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { confirmAction } from "@/utils/confirm";

export function AccountScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const { user, logout, deleteAccount, submitting, error, clearError } = useAuth();
  const [password, setPassword] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const confirmDelete = () =>
    confirmAction(
      "Delete your account?",
      "This permanently deletes your account, snippets, categories, and sessions.",
      "Delete account",
      () => {
        void deleteAccount(password);
      },
    );

  return (
    <AppShell title="Account settings">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { padding: width < 650 ? 20 : 36 }]}
      >
        <PageHeading
          eyebrow="MAKE YOURSELF AT HOME"
          title="Your workspace, your way."
          description="Manage your account, choose your appearance, and keep things personal."
        />
        <View style={styles.panel}>
          <View style={styles.sectionHeading}>
            <Icon name="user" color={colors.accent} size={18} />
            <Text style={styles.sectionTitle}>Profile</Text>
          </View>
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 7 }}>
              <Text style={styles.profileTitle}>Personal account</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.privacy}>
            <Icon name="lock" color={colors.muted} size={13} />
            <Text style={styles.description}>
              Your snippets and categories are only visible to you.
            </Text>
          </View>
        </View>
        <View style={styles.panel}>
          <View style={styles.sectionHeading}>
            <Icon name="sliders" color={colors.accent} size={18} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <View
            style={[
              styles.settingRow,
              width < 650 && { flexDirection: "column", alignItems: "flex-start" },
            ]}
          >
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Appearance</Text>
              <Text style={styles.description}>
                A comfortable space for your code. Currently using {mode} mode.
              </Text>
            </View>
            <AppButton
              title={mode === "dark" ? "Switch to light" : "Switch to dark"}
              icon={mode === "dark" ? "sun" : "moon"}
              tone="secondary"
              onPress={toggleTheme}
            />
          </View>
        </View>
        <View style={styles.panel}>
          <View style={styles.sectionHeading}>
            <Icon name="shield" color={colors.accent} size={18} />
            <Text style={styles.sectionTitle}>Session</Text>
          </View>
          <View
            style={[
              styles.settingRow,
              width < 650 && { flexDirection: "column", alignItems: "flex-start" },
            ]}
          >
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Sign out of this device</Text>
              <Text style={styles.description}>
                Your collection will be here when you come back.
              </Text>
            </View>
            <AppButton
              title="Sign out"
              tone="secondary"
              icon="log-out"
              loading={submitting && !showDelete}
              disabled={submitting}
              onPress={logout}
            />
          </View>
        </View>
        <View style={[styles.panel, { borderColor: colors.dangerSoft }]}>
          <View style={styles.sectionHeading}>
            <Icon name="alert-triangle" color={colors.danger} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.danger }]}>Delete account</Text>
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Permanently remove your workspace</Text>
            <Text style={styles.description}>
              This deletes your account and every snippet and category you’ve saved. This action
              cannot be undone.
            </Text>
          </View>
          {showDelete ? (
            <View style={styles.deleteForm}>
              <AppTextInput
                label="Confirm your password"
                value={password}
                onChangeText={(value) => {
                  clearError();
                  setPassword(value);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                placeholder="Enter your current password"
                editable={!submitting}
              />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <View style={styles.deleteActions}>
                <AppButton
                  title="Cancel"
                  tone="secondary"
                  disabled={submitting}
                  onPress={() => {
                    setShowDelete(false);
                    setPassword("");
                    clearError();
                  }}
                />
                <AppButton
                  title="Delete account"
                  tone="danger"
                  icon="trash-2"
                  loading={submitting}
                  disabled={!password || submitting}
                  onPress={confirmDelete}
                />
              </View>
            </View>
          ) : (
            <AppButton
              title="Delete account"
              tone="danger"
              icon="trash-2"
              onPress={() => {
                clearError();
                setShowDelete(true);
              }}
              style={{ alignSelf: "flex-start" }}
            />
          )}
        </View>
        <View style={styles.footer}>
          <Icon name="code" color={colors.muted} size={15} />
          <Text style={styles.footerText}>Snippet Store · A home for your best code.</Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { width: "100%", maxWidth: 1100, alignSelf: "center", gap: 24, paddingBottom: 40 },
    panel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 24,
      gap: 24,
    },
    sectionHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
    sectionTitle: { fontFamily: fonts.sans, color: colors.text, fontSize: 14, fontWeight: "600" },
    profile: { flexDirection: "row", alignItems: "center", gap: 17 },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
    },
    avatarText: { fontFamily: fonts.sans, color: colors.accent, fontSize: 23, fontWeight: "600" },
    profileTitle: { fontFamily: fonts.sans, color: colors.text, fontSize: 15, fontWeight: "500" },
    email: { fontFamily: fonts.sans, color: colors.muted, fontSize: 12 },
    privacy: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 18,
    },
    settingRow: { flexDirection: "row", alignItems: "center", gap: 20 },
    settingText: { flex: 1, gap: 8 },
    settingTitle: { fontFamily: fonts.sans, color: colors.text, fontSize: 13, fontWeight: "500" },
    description: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 21,
      flexShrink: 1,
    },
    deleteForm: { maxWidth: 430, gap: 18 },
    deleteActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    error: { fontFamily: fonts.sans, color: colors.danger, fontSize: 12, lineHeight: 20 },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      padding: 15,
    },
    footerText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
  });
}
