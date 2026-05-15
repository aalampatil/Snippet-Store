import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from "@/constants/theme";

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeStorageKey = "snippetstore.theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(themeStorageKey).then((storedMode) => {
      if (storedMode === "dark" || storedMode === "light") {
        setMode(storedMode);
      }
    });
  }, []);

  const toggleTheme = () => {
    setMode((current) => {
      const nextMode = current === "dark" ? "light" : "dark";
      AsyncStorage.setItem(themeStorageKey, nextMode);
      return nextMode;
    });
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: mode === "dark" ? darkColors : lightColors,
      mode,
      toggleTheme,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
