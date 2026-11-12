import axios from "axios";
import { Platform } from "react-native";
import { getCurrentToken } from "./authStorage";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? process.env.EXPO_PUBLIC_LOCAL_API_URL : process.env.EXPO_PUBLIC_PRODUCTION_API_URL);
if (!baseURL || !/^https?:\/\//.test(baseURL))
  throw new Error("Set EXPO_PUBLIC_API_URL to your API URL before starting or building the app.");
if (!__DEV__ && !baseURL.startsWith("https://"))
  throw new Error("Production requires an HTTPS API URL.");

export const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: Platform.OS === "web",
  headers: Platform.OS === "web" ? {} : { "X-Client-Platform": "native" },
});
api.interceptors.request.use((config) => {
  const token = getCurrentToken();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler?: () => void) {
  onUnauthorized = handler;
}
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isSessionRequest = url === "/api/auth/me" || !url.startsWith("/api/auth/");
      const token = getCurrentToken();
      const matchesSession =
        Platform.OS === "web" || error.config?.headers.Authorization === `Bearer ${token}`;
      if (isSessionRequest && matchesSession) onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
