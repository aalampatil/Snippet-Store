import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { Screen } from "@/components/Screen";
import { spacing, type ThemeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { register, user, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Your snippets will be scoped to your account.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.form}>
        <AppTextInput
          label="Email"
          value={email}
          onChangeText={(t) => {
            if (error) clearError();
            setEmail(t);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          returnKeyType="next"
        />
        <AppTextInput
          label="Password"
          value={password}
          onChangeText={(t) => {
            if (error) clearError();
            setPassword(t);
          }}
          secureTextEntry
          placeholder="At least 8 characters"
          returnKeyType="done"
          onSubmitEditing={() => register(email, password)}
        />

        <AppButton title={loading ? "Creating..." : "Create account"} disabled={loading} onPress={() => register(email, password)} />
        <AppButton title="Back to sign in" tone="secondary" disabled={loading} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      padding: spacing.md,
      gap: spacing.lg,
    },
    header: {
      gap: spacing.xs,
      paddingTop: spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "900",
    },
    subtitle: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    form: {
      gap: spacing.md,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
    },
  });
}

