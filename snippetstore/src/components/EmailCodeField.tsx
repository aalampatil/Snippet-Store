import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts } from "@/constants/theme";
import type { EmailChallenge } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AppButton } from "./AppButton";
import { AppTextInput } from "./AppTextInput";

export function EmailCodeField({
  challenge,
  code,
  onChange,
  onResend,
  onSubmit,
  disabled,
}: {
  challenge: EmailChallenge;
  code: string;
  onChange: (code: string) => void;
  onResend: () => void;
  onSubmit?: () => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const resendSeconds = Math.max(0, Math.ceil((challenge.resendAt - now) / 1000));
  const remaining = Math.max(0, Math.ceil((new Date(challenge.expiresAt).getTime() - now) / 1000));
  return (
    <View style={styles.field}>
      <AppTextInput
        label="Verification code"
        value={code}
        onChangeText={(value) => onChange(value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
        inputMode="numeric"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={6}
        editable={!disabled}
        autoFocus
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        style={styles.input}
      />
      <Text
        accessibilityLiveRegion={remaining === 0 ? "polite" : "none"}
        style={[styles.help, { color: remaining === 0 ? colors.danger : colors.muted }]}
      >
        {remaining === 0
          ? "This code has expired. Request a new code to continue."
          : `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
      </Text>
      <AppButton
        title={resendSeconds ? `Resend code in ${resendSeconds}s` : "Resend code"}
        tone="ghost"
        icon="refresh-cw"
        disabled={disabled || resendSeconds > 0}
        onPress={onResend}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 12 },
  input: {
    fontFamily: fonts.mono,
    fontSize: 27,
    letterSpacing: 9,
    textAlign: "center",
    minHeight: 62,
  },
  help: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 19, textAlign: "center" },
});
