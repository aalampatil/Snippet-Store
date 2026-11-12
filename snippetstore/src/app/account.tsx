import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function AccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, logout, deleteAccount, submitting, error } = useAuth();
  const [password, setPassword] = useState("");
  const confirmDelete = () => Alert.alert("Delete your account?", "This permanently deletes your account, snippets, categories, and sessions.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete account", style: "destructive", onPress: () => { void deleteAccount(password); } },
  ]);
  return <Screen><ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
    <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Your account</Text>
    <Text style={{ color: colors.text }}>{user?.email}</Text>
    <AppButton title="Back to snippets" tone="secondary" onPress={() => router.replace("/")} />
    <AppButton title="Sign out" tone="secondary" disabled={submitting} onPress={logout} />
    <Text style={{ color: colors.muted }}>To permanently delete your account and all its data, confirm your password.</Text>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
    <AppTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"
      autoComplete="current-password" editable={!submitting} />
    <AppButton title={submitting ? "Please wait..." : "Delete account"} tone="danger" disabled={submitting || !password} onPress={confirmDelete} />
  </ScrollView></Screen>;
}
