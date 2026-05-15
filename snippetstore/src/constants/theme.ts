export const darkColors = {
  background: "#0e0e0e",
  surface: "#161616",
  surfaceAlt: "#202020",
  accent: "#d4ff00",
  text: "#f0f0f0",
  muted: "#666666",
  border: "#2a2a2a",
  danger: "#ff6b6b",
};

export const lightColors = {
  background: "#f5f5f2",
  surface: "#ffffff",
  surfaceAlt: "#eeeeea",
  accent: "#7aa300",
  text: "#111111",
  muted: "#6b6b6b",
  border: "#d8d8d0",
  danger: "#c43b3b",
};

export const colors = darkColors;

export type ThemeColors = typeof darkColors;
export type ThemeMode = "dark" | "light";

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};
