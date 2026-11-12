import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "snippetstore.session.v2";
let currentToken: string | null = null;
let pendingWrite = Promise.resolve();
export const getCurrentToken = () => currentToken;
export async function readSession() {
  // Invalidate legacy JWTs and remove their unencrypted copies.
  await AsyncStorage.removeItem("auth_token");
  currentToken = Platform.OS === "web" ? null : await SecureStore.getItemAsync(KEY);
  return currentToken;
}
export async function writeSession(token: string | null) {
  if (!token) currentToken = null;
  const write = pendingWrite.catch(() => {}).then(async () => {
    if (Platform.OS !== "web") {
      if (token) await SecureStore.setItemAsync(KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      else await SecureStore.deleteItemAsync(KEY);
    }
    currentToken = token;
  });
  pendingWrite = write;
  await write;
}
