import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/theme";
import { useAuth, type EmailChallenge } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AppButton } from "./AppButton";
import { AppTextInput } from "./AppTextInput";
import { EmailCodeField } from "./EmailCodeField";
import { Icon } from "./Icon";

export function EmailLoginForm({
  registerMode,
  onUsePassword,
}: {
  registerMode: boolean;
  onUsePassword: () => void;
}) {
  const { colors } = useTheme();
  const { requestLoginCode, verifyLoginCode, submitting, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<EmailChallenge | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidation("Enter a valid email address.");
      return;
    }
    setValidation(null);
    const result = await requestLoginCode(email);
    if (result) {
      setChallenge(result);
      setCode("");
    }
  };
  const verify = async () => {
    if (!challenge || submitting) return;
    if (!/^\d{6}$/.test(code)) {
      setValidation("Enter the six-digit code from your email.");
      return;
    }
    setValidation(null);
    await verifyLoginCode(email, challenge.challengeId, code);
  };
  return (
    <View style={styles.form}>
      <View style={[styles.mark, { backgroundColor: colors.accentSoft }]}>
        <Icon name={challenge ? "mail" : "log-in"} color={colors.accent} size={24} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {challenge
          ? "Check your inbox."
          : registerMode
            ? "Make room for great code."
            : "Your code. One email away."}
      </Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        {challenge
          ? `We sent a six-digit code to ${email.trim()}. Enter it below to continue.`
          : "Enter your email to sign in or create an account. No password to remember."}
      </Text>
      {validation || error ? (
        <View style={[styles.notice, { backgroundColor: colors.dangerSoft }]}>
          <Text accessibilityRole="alert" style={[styles.noticeText, { color: colors.danger }]}>
            {validation ?? error}
          </Text>
        </View>
      ) : null}
      {challenge ? (
        <>
          <EmailCodeField
            challenge={challenge}
            code={code}
            onChange={(value) => {
              setCode(value);
              setValidation(null);
              clearError();
            }}
            onResend={() => void sendCode()}
            onSubmit={() => void verify()}
            disabled={submitting}
          />
          <AppButton
            title="Verify and continue"
            icon="arrow-right"
            onPress={verify}
            loading={submitting}
            disabled={code.length !== 6}
          />
          <AppButton
            title="Use a different email"
            tone="ghost"
            icon="arrow-left"
            disabled={submitting}
            onPress={() => {
              setChallenge(null);
              setCode("");
              setValidation(null);
              clearError();
            }}
          />
        </>
      ) : (
        <>
          <AppTextInput
            label="Email address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setValidation(null);
              clearError();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            editable={!submitting}
            maxLength={255}
            onSubmitEditing={() => void sendCode()}
            returnKeyType="go"
          />
          <AppButton
            title="Continue with email"
            icon="arrow-right"
            onPress={sendCode}
            loading={submitting}
          />
          <Text style={[styles.help, { color: colors.muted }]}>
            We’ll send a code to confirm it’s really you.
          </Text>
        </>
      )}
      <View style={[styles.alternative, { borderColor: colors.border }]}>
        <AppButton
          title="Use a password instead"
          icon="key"
          tone="ghost"
          onPress={() => {
            clearError();
            onUsePassword();
          }}
          disabled={submitting}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  form: { gap: 20 },
  mark: {
    width: 51,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -1,
    lineHeight: 38,
  },
  description: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 22, marginBottom: 5 },
  help: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 19, textAlign: "center" },
  notice: { padding: 13, borderRadius: 8 },
  noticeText: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 20 },
  alternative: { borderTopWidth: 1, paddingTop: 14, marginTop: 5 },
});
