import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { Screen } from "@/components/Screen";
import { spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export function AuthForm({ mode }: { mode: "login" | "register" | "recovery" }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { login, register, requestEmail, submitting, error, message, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const title =
    mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Recover your account";
  const validateEmail = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidation("Enter a valid email address.");
      return false;
    }
    setValidation(null);
    return true;
  };
  const submit = async () => {
    if (submitting || !validateEmail()) return;
    if (mode === "recovery") {
      await requestEmail(email, "reset");
      return;
    }
    if (!password || (mode === "register" && (password.length < 8 || password.length > 128))) {
      setValidation(
        mode === "register" ? "Use a password with 8–128 characters." : "Enter your password.",
      );
      return;
    }
    if (mode === "register" && password !== confirmation) {
      setValidation("Passwords do not match.");
      return;
    }
    await (mode === "login" ? login : register)(email, password);
    setPassword("");
    setConfirmation("");
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: colors.muted }}>
          {mode === "register"
            ? "Verify your email to start saving private snippets."
            : mode === "recovery"
              ? "We'll email a link so you can set a new password."
              : "Your snippets, saved privately to your account."}
        </Text>
        {validation || error ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {validation ?? error}
          </Text>
        ) : null}
        {message ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>
            {message}
          </Text>
        ) : null}
        <AppTextInput
          label="Email"
          accessibilityLabel="Email address"
          value={email}
          onChangeText={(value) => {
            clearError();
            setValidation(null);
            setEmail(value);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
          editable={!submitting}
          maxLength={255}
        />
        {mode !== "recovery" ? (
          <AppTextInput
            label="Password"
            accessibilityLabel="Password"
            value={password}
            onChangeText={(value) => {
              clearError();
              setValidation(null);
              setPassword(value);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            textContentType={mode === "login" ? "password" : "newPassword"}
            editable={!submitting}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            maxLength={mode === "register" ? 128 : 200}
            onSubmitEditing={mode === "login" ? submit : undefined}
          />
        ) : null}
        {mode === "register" ? (
          <AppTextInput
            label="Confirm password"
            accessibilityLabel="Confirm password"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            maxLength={128}
            onSubmitEditing={submit}
          />
        ) : null}
        <AppButton
          title={submitting ? "Please wait..." : mode === "recovery" ? "Send reset email" : title}
          disabled={submitting}
          onPress={submit}
        />
        {mode === "login" ? (
          <>
            <AppButton
              title="Create account"
              tone="secondary"
              disabled={submitting}
              onPress={() => {
                clearError();
                router.push("/register");
              }}
            />
            <AppButton
              title="Forgot password?"
              tone="secondary"
              disabled={submitting}
              onPress={() => {
                clearError();
                router.push("/recovery");
              }}
            />
          </>
        ) : (
          <AppButton
            title="Back to sign in"
            tone="secondary"
            disabled={submitting}
            onPress={() => {
              clearError();
              router.replace("/login");
            }}
          />
        )}
        {mode !== "recovery" ? (
          <View>
            <AppButton
              title="Resend verification email"
              tone="secondary"
              disabled={submitting}
              onPress={() => {
                if (validateEmail()) void requestEmail(email, "verify");
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
});
