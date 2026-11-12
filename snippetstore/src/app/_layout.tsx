import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StatusBar as NativeStatusBar, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootStack() {
  const { colors, mode } = useTheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);

    if (Platform.OS === "android") {
      NativeStatusBar.setTranslucent(true);
      NativeStatusBar.setBackgroundColor("transparent", true);
      NativeStatusBar.setBarStyle(mode === "dark" ? "light-content" : "dark-content", true);
    }
  }, [colors.background, mode]);

  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
    <ActivityIndicator color={colors.accent} />
  </View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar hidden={false} style={mode === "dark" ? "light" : "dark"} backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="recovery" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="index" />
          <Stack.Screen name="account" />
          <Stack.Screen name="snippets/new" />
          <Stack.Screen name="snippets/[id]" />
          <Stack.Screen name="snippets/[id]/edit" />
          <Stack.Screen name="categories/index" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}
