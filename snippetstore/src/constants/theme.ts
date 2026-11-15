import { Platform } from "react-native";

export const darkColors = {
  background: "#101214",
  surface: "#181B1E",
  surfaceAlt: "#202428",
  sidebar: "#141719",
  code: "#121517",
  accent: "#8CE5C0",
  accentSoft: "#203B32",
  onAccent: "#10271D",
  text: "#F1F3F4",
  secondary: "#B6BDC3",
  muted: "#89939C",
  border: "#2B3035",
  danger: "#F39191",
  dangerSoft: "#362326",
  success: "#8CE5C0",
  syntaxKeyword: "#C4A7E7",
  syntaxString: "#A3D9AC",
  syntaxNumber: "#EABF8B",
};

export const lightColors: ThemeColors = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF1F4",
  sidebar: "#FFFFFF",
  code: "#F6F8FA",
  accent: "#176B4B",
  accentSoft: "#E4F4EB",
  onAccent: "#FFFFFF",
  text: "#182229",
  secondary: "#505F6B",
  muted: "#697784",
  border: "#E1E6EB",
  danger: "#BC3E48",
  dangerSoft: "#FCECEE",
  success: "#176B4B",
  syntaxKeyword: "#8052AD",
  syntaxString: "#27764C",
  syntaxNumber: "#A26618",
};

export const colors = darkColors;
export type ThemeColors = typeof darkColors;
export type ThemeMode = "dark" | "light";
export const fonts = {
  sans: Platform.select({
    web: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    ios: "System",
    default: "sans-serif",
  }),
  mono: Platform.select({
    web: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
    ios: "Menlo",
    default: "monospace",
  }),
};
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };
