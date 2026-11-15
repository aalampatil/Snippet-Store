import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { fonts } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Icon, type IconName } from "./Icon";

type AppTextInputProps = TextInputProps & {
  label: string;
  hint?: string;
  hideLabel?: boolean;
  icon?: IconName;
  code?: boolean;
};
export function AppTextInput({
  label,
  hint,
  hideLabel,
  icon,
  code,
  style,
  multiline,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}: AppTextInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      {!hideLabel ? <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: code ? colors.code : colors.surface,
            borderColor: focused ? colors.accent : colors.border,
          },
          multiline && { alignItems: "flex-start" },
        ]}
      >
        {icon ? (
          <View style={styles.leading}>
            <Icon name={icon} color={colors.muted} size={17} />
          </View>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          secureTextEntry={secureTextEntry && !visible}
          multiline={multiline}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accent}
          style={[
            styles.input,
            { color: colors.text, fontFamily: code ? fonts.mono : fonts.sans },
            multiline && styles.multiline,
            style,
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`
            }
            onPress={() => setVisible(!visible)}
            style={styles.visibility}
          >
            <Icon name={visible ? "eye-off" : "eye"} color={colors.muted} size={17} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontFamily: fonts.sans, fontSize: 12, fontWeight: "600" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  multiline: { minHeight: 100, textAlignVertical: "top", lineHeight: 23 },
  leading: { paddingLeft: 14 },
  visibility: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  hint: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18 },
});
