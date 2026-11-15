import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fonts, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

const tokenPattern =
  /(\/\/.*|#.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|\b(?:export|default|const|let|var|function|async|await|return|if|else|import|from|class|new|throw|try|catch|def|print|for|in|while|true|false|null|None|SELECT|FROM|WHERE|AND|AS)\b|\b\d+(?:\.\d+)?\b)/g;

function HighlightedLine({ line, colors }: { line: string; colors: ThemeColors }) {
  return (
    <Text selectable style={[styles.line, { color: colors.secondary }]}>
      {line.split(tokenPattern).map((part, index) => {
        const color = /^(\/\/|#)/.test(part)
          ? colors.muted
          : /^["'`]/.test(part)
            ? colors.syntaxString
            : /^\d/.test(part)
              ? colors.syntaxNumber
              : /^(export|default|const|let|var|function|async|await|return|if|else|import|from|class|new|throw|try|catch|def|print|for|in|while|true|false|null|None|SELECT|FROM|WHERE|AND|AS)$/.test(
                    part,
                  )
                ? colors.syntaxKeyword
                : colors.secondary;
        return (
          <Text key={index} style={{ color }}>
            {part || ""}
          </Text>
        );
      })}
      {line.length === 0 ? " " : ""}
    </Text>
  );
}

export function CodeBlock({ content, preview = false }: { content: string; preview?: boolean }) {
  const { colors } = useTheme();
  const lines = content.split("\n");
  const shown = preview ? lines.slice(0, 5) : lines;
  const body = (
    <View style={[styles.code, preview && { minHeight: 136 }]}>
      {shown.map((line, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.number, { color: colors.muted }]} selectable={false}>
            {index + 1}
          </Text>
          <HighlightedLine line={preview ? line.slice(0, 160) : line} colors={colors} />
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ backgroundColor: colors.code, overflow: "hidden" }}>
      {preview ? (
        body
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          {body}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  code: { paddingVertical: 16, paddingRight: 20, minWidth: "100%" },
  row: { flexDirection: "row", minHeight: 22 },
  number: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 22,
    width: 45,
    paddingRight: 14,
    textAlign: "right",
    opacity: 0.65,
  },
  line: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 22, flexShrink: 0 },
});
