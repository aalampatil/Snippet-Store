import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextInput } from "@/components/AppTextInput";
import { Brand } from "@/components/Brand";
import { CodeBlock } from "@/components/CodeBlock";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const example =
  "// A little less searching. A lot more building.\nexport const keepTheGoodParts = async () => {\n  const idea = await findInspiration();\n  return saveForLater(idea);\n};";

export function AuthForm({ mode }: { mode: "login" | "register" | "recovery" }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const styles = createStyles(colors);
  const { login, register, requestEmail, submitting, error, message, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const title =
    mode === "login"
      ? "Welcome back."
      : mode === "register"
        ? "Make room for great code."
        : "Let’s get you back in.";
  const actionTitle =
    mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email";
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
  const navigate = (path: "/login" | "/register" | "/recovery") => {
    clearError();
    setValidation(null);
    router.push(path);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.layout, !wide && { flexDirection: "column" }]}>
            {wide ? (
              <View style={styles.story}>
                <Brand />
                <View style={styles.pitch}>
                  <View style={styles.badge}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeText}>A SMALL SPACE FOR YOUR BIG IDEAS</Text>
                  </View>
                  <Text style={styles.headline}>
                    Good code.{"\n"}
                    <Text style={{ color: colors.accent }}>Kept close.</Text>
                  </Text>
                  <Text style={styles.storyDescription}>
                    Your go-to functions, handy commands, and hard-won solutions. One thoughtfully
                    organized home.
                  </Text>
                  <View style={styles.example}>
                    <View style={styles.exampleHeader}>
                      <View style={styles.windowDots}>
                        {["#E68D8D", "#DEC17C", "#8BC8A1"].map((color) => (
                          <View
                            key={color}
                            style={[styles.windowDot, { backgroundColor: color }]}
                          />
                        ))}
                      </View>
                      <Text style={styles.fileName}>the-good-parts.ts</Text>
                      <Icon name="code" color={colors.muted} size={14} />
                    </View>
                    <CodeBlock content={example} />
                    <View style={styles.exampleFooter}>
                      <Icon name="check-circle" color={colors.accent} size={13} />
                      <Text style={styles.exampleFooterText}>Saved for your next great idea</Text>
                    </View>
                  </View>
                  <View style={styles.features}>
                    <View style={styles.feature}>
                      <Icon name="search" color={colors.accent} size={15} />
                      <Text style={styles.featureText}>Find it in seconds</Text>
                    </View>
                    <View style={styles.feature}>
                      <Icon name="lock" color={colors.accent} size={15} />
                      <Text style={styles.featureText}>Private by default</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.storyFooter}>BUILT FOR THE WAY DEVELOPERS THINK.</Text>
              </View>
            ) : null}
            <View style={[styles.formSide, !wide && { padding: 24 }]}>
              <View style={styles.authTop}>
                {!wide ? <Brand /> : <View />}
                <ThemeToggle />
              </View>
              <View style={styles.formCenter}>
                <View style={styles.form}>
                  <View style={styles.formIntro}>
                    <View style={styles.formIcon}>
                      <Icon
                        name={
                          mode === "recovery" ? "key" : mode === "register" ? "code" : "terminal"
                        }
                        color={colors.accent}
                        size={24}
                      />
                    </View>
                    <Text accessibilityRole="header" style={styles.title}>
                      {title}
                    </Text>
                    <Text style={styles.description}>
                      {mode === "register"
                        ? "Create your personal snippet library. Your first great save is just a moment away."
                        : mode === "recovery"
                          ? "Enter your email and we’ll send a link to reset your password."
                          : "Sign in to your workspace. Your best code is waiting."}
                    </Text>
                  </View>
                  {validation || error ? (
                    <View style={[styles.notice, { backgroundColor: colors.dangerSoft }]}>
                      <Text
                        accessibilityRole="alert"
                        style={[styles.noticeText, { color: colors.danger }]}
                      >
                        {validation ?? error}
                      </Text>
                    </View>
                  ) : null}
                  {message ? (
                    <View style={[styles.notice, { backgroundColor: colors.accentSoft }]}>
                      <Text
                        accessibilityLiveRegion="polite"
                        style={[styles.noticeText, { color: colors.accent }]}
                      >
                        {message}
                      </Text>
                    </View>
                  ) : null}
                  <AppTextInput
                    label="Email address"
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
                    onSubmitEditing={mode === "recovery" ? submit : undefined}
                  />
                  {mode !== "recovery" ? (
                    <AppTextInput
                      label="Password"
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
                      placeholder={
                        mode === "register" ? "At least 8 characters" : "Enter your password"
                      }
                      maxLength={mode === "register" ? 128 : 200}
                      onSubmitEditing={mode === "login" ? submit : undefined}
                    />
                  ) : null}
                  {mode === "login" ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={submitting}
                      onPress={() => navigate("/recovery")}
                      style={styles.forgot}
                    >
                      <Text style={styles.link}>Forgot password?</Text>
                    </Pressable>
                  ) : null}
                  {mode === "register" ? (
                    <AppTextInput
                      label="Confirm password"
                      value={confirmation}
                      onChangeText={setConfirmation}
                      secureTextEntry
                      autoComplete="new-password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!submitting}
                      maxLength={128}
                      placeholder="Re-enter your password"
                      onSubmitEditing={submit}
                    />
                  ) : null}
                  <AppButton
                    title={submitting ? "Please wait…" : actionTitle}
                    icon="arrow-right"
                    loading={submitting}
                    onPress={submit}
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>
                      {mode === "login"
                        ? "New to Snippet Store?"
                        : mode === "register"
                          ? "Already have an account?"
                          : "Remember your password?"}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={submitting}
                      onPress={() => navigate(mode === "login" ? "/register" : "/login")}
                      style={styles.textButton}
                    >
                      <Text style={styles.link}>
                        {mode === "login" ? "Create account" : "Back to sign in"}
                      </Text>
                    </Pressable>
                  </View>
                  {mode !== "recovery" ? (
                    <View style={styles.verification}>
                      <Text style={styles.verificationText}>
                        Waiting for your verification email?
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        disabled={submitting}
                        onPress={() => {
                          if (validateEmail()) void requestEmail(email, "verify");
                        }}
                        style={styles.textButton}
                      >
                        <Text style={styles.subtleLink}>Resend verification email</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.security}>
                <Icon name="shield" color={colors.muted} size={13} />
                <Text style={styles.securityText}>Your code belongs to you. Always.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    layout: { flex: 1, flexDirection: "row", minHeight: "100%" },
    story: {
      width: "49%",
      backgroundColor: colors.sidebar,
      borderRightWidth: 1,
      borderColor: colors.border,
      padding: 44,
      justifyContent: "space-between",
      gap: 50,
    },
    pitch: { gap: 26, maxWidth: 530, alignSelf: "center", width: "100%" },
    badge: { flexDirection: "row", alignItems: "center", gap: 8 },
    badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
    badgeText: {
      fontFamily: fonts.sans,
      fontSize: 9,
      fontWeight: "600",
      color: colors.secondary,
      letterSpacing: 1.5,
    },
    headline: {
      fontFamily: fonts.sans,
      fontSize: 64,
      lineHeight: 72,
      fontWeight: "600",
      letterSpacing: -3.5,
      color: colors.text,
    },
    storyDescription: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 26,
      maxWidth: 390,
    },
    example: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 10,
    },
    exampleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      padding: 15,
    },
    windowDots: { flexDirection: "row", gap: 5 },
    windowDot: { width: 7, height: 7, borderRadius: 4 },
    fileName: { fontFamily: fonts.mono, color: colors.muted, fontSize: 10 },
    exampleFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      padding: 13,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    exampleFooterText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
    features: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
    feature: { flexDirection: "row", alignItems: "center", gap: 7 },
    featureText: { fontFamily: fonts.sans, color: colors.secondary, fontSize: 11 },
    storyFooter: { fontFamily: fonts.sans, fontSize: 9, color: colors.muted, letterSpacing: 1.5 },
    formSide: { flex: 1, padding: 32, minHeight: 700 },
    authTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    formCenter: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 44 },
    form: { width: "100%", maxWidth: 370, gap: 20 },
    formIntro: { gap: 14, marginBottom: 10 },
    formIcon: {
      width: 51,
      height: 51,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
      borderRadius: 14,
      marginBottom: 10,
    },
    title: {
      fontFamily: fonts.sans,
      color: colors.text,
      fontSize: 30,
      fontWeight: "600",
      letterSpacing: -1,
      lineHeight: 38,
    },
    description: { fontFamily: fonts.sans, color: colors.muted, fontSize: 13, lineHeight: 22 },
    notice: { padding: 13, borderRadius: 8 },
    noticeText: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 20 },
    forgot: { alignSelf: "flex-end", minHeight: 30, justifyContent: "center", marginTop: -13 },
    link: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600", color: colors.accent },
    switchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    switchText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 12 },
    textButton: { minHeight: 32, justifyContent: "center" },
    verification: {
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 22,
      marginTop: 5,
      gap: 2,
    },
    verificationText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 11 },
    subtleLink: {
      fontFamily: fonts.sans,
      color: colors.secondary,
      fontSize: 11,
      textDecorationLine: "underline",
    },
    security: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    securityText: { fontFamily: fonts.sans, color: colors.muted, fontSize: 10 },
  });
}
